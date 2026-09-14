-- ============================================================================
-- College Shared Cab & Shuttle Platform - Functions, Procedures & Triggers
-- Migration: 20260914000001_functions_and_triggers.sql
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Timestamp updater trigger function
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply timestamp triggers to relevant tables
DO $$
DECLARE
    tbl text;
BEGIN
    FOR tbl IN
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name IN (
            'users', 'colleges', 'student_profiles', 'driver_profiles', 'admin_profiles',
            'pickup_points', 'vehicles', 'routes', 'subscription_plans', 'subscriptions',
            'trips', 'bookings', 'trip_passengers', 'daily_travel_passes', 'payments',
            'refunds', 'complaints', 'emergency_contacts', 'system_settings'
          )
    LOOP
        EXECUTE format('
            DROP TRIGGER IF EXISTS trg_update_%I_updated_at ON %I;
            CREATE TRIGGER trg_update_%I_updated_at
            BEFORE UPDATE ON %I
            FOR EACH ROW
            EXECUTE FUNCTION fn_update_updated_at();
        ', tbl, tbl, tbl, tbl);
    END LOOP;
END $$;

-- ----------------------------------------------------------------------------
-- 2. Concurrency-Safe Atomic Booking Transaction Procedure
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_book_trip_atomic(
    p_student_id UUID,
    p_subscription_id UUID,
    p_trip_id UUID,
    p_pickup_point_id UUID,
    p_auth_token_hash VARCHAR(255),
    p_pass_valid_until TIMESTAMPTZ
)
RETURNS JSONB AS $$
DECLARE
    v_trip RECORD;
    v_sub RECORD;
    v_booking_id UUID;
    v_pass_id UUID;
    v_existing_booking UUID;
    v_route_id UUID;
    v_trip_date DATE;
    v_trip_type trip_type;
    v_seat_num INTEGER;
BEGIN
    -- 1. Check existing booking for student on this trip
    SELECT id INTO v_existing_booking
    FROM bookings
    WHERE student_id = p_student_id
      AND trip_id = p_trip_id
      AND status = 'CONFIRMED';

    IF v_existing_booking IS NOT NULL THEN
        RAISE EXCEPTION 'DUPLICATE_BOOKING: You already have a confirmed booking for this trip.';
    END IF;

    -- 2. Lock and validate the Trip row with pessimistic lock
    SELECT id, route_id, trip_date, trip_type, max_capacity, booked_seats, status
    INTO v_trip
    FROM trips
    WHERE id = p_trip_id
    FOR UPDATE;

    IF v_trip.id IS NULL THEN
        RAISE EXCEPTION 'TRIP_NOT_FOUND: The requested trip does not exist.';
    END IF;

    IF v_trip.status <> 'SCHEDULED' THEN
        RAISE EXCEPTION 'TRIP_UNAVAILABLE: Trip is not available for booking (status: %).', v_trip.status;
    END IF;

    IF v_trip.booked_seats >= v_trip.max_capacity THEN
        RAISE EXCEPTION 'FULLY_BOOKED: No seats remaining on this trip.';
    END IF;

    -- 3. Lock and validate Active Subscription
    SELECT id, remaining_rides, status, end_date
    INTO v_sub
    FROM subscriptions
    WHERE id = p_subscription_id
      AND student_id = p_student_id
    FOR UPDATE;

    IF v_sub.id IS NULL THEN
        RAISE EXCEPTION 'INVALID_SUBSCRIPTION: Subscription does not belong to student.';
    END IF;

    IF v_sub.status <> 'ACTIVE' THEN
        RAISE EXCEPTION 'SUBSCRIPTION_INACTIVE: Your subscription is not active (status: %).', v_sub.status;
    END IF;

    IF v_sub.end_date < v_trip.trip_date THEN
        RAISE EXCEPTION 'SUBSCRIPTION_EXPIRED: Subscription expires before the travel date.';
    END IF;

    IF v_sub.remaining_rides <= 0 THEN
        RAISE EXCEPTION 'NO_RIDES_REMAINING: No rides remaining in this subscription.';
    END IF;

    -- 4. Calculate seat number
    v_seat_num := v_trip.booked_seats + 1;
    v_route_id := v_trip.route_id;
    v_trip_date := v_trip.trip_date;
    v_trip_type := v_trip.trip_type;

    -- 5. Deduct ride credit from subscription
    UPDATE subscriptions
    SET remaining_rides = remaining_rides - 1
    WHERE id = p_subscription_id;

    -- 6. Insert Booking record
    INSERT INTO bookings (
        student_id, subscription_id, trip_id, route_id, pickup_point_id,
        booking_date, trip_type, seat_number, status
    ) VALUES (
        p_student_id, p_subscription_id, p_trip_id, v_route_id, p_pickup_point_id,
        v_trip_date, v_trip_type, v_seat_num, 'CONFIRMED'
    ) RETURNING id INTO v_booking_id;

    -- 7. Add to Passenger Manifest
    INSERT INTO trip_passengers (
        trip_id, booking_id, student_id, pickup_point_id, status
    ) VALUES (
        p_trip_id, v_booking_id, p_student_id, p_pickup_point_id, 'WAITING'
    );

    -- 8. Increment booked seats count on Trip
    UPDATE trips
    SET booked_seats = booked_seats + 1
    WHERE id = p_trip_id;

    -- 9. Generate Daily Travel Pass
    INSERT INTO daily_travel_passes (
        student_id, booking_id, trip_id, pass_date, trip_type,
        route_id, pickup_point_id, auth_token_hash, valid_until, status
    ) VALUES (
        p_student_id, v_booking_id, p_trip_id, v_trip_date, v_trip_type,
        v_route_id, p_pickup_point_id, p_auth_token_hash, p_pass_valid_until, 'ACTIVE'
    ) RETURNING id INTO v_pass_id;

    -- Return JSON payload of the created booking and pass
    RETURN jsonb_build_object(
        'success', true,
        'booking_id', v_booking_id,
        'pass_id', v_pass_id,
        'trip_id', p_trip_id,
        'seat_number', v_seat_num,
        'booked_seats', v_seat_num,
        'remaining_rides', v_sub.remaining_rides - 1
    );
END;
$$ LANGUAGE plpgsql;

-- ----------------------------------------------------------------------------
-- 3. Dynamic QR Validation and Boarding Procedure
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_validate_and_board_qr(
    p_pass_id UUID,
    p_trip_id UUID,
    p_driver_id UUID,
    p_client_lat DOUBLE PRECISION DEFAULT NULL,
    p_client_lng DOUBLE PRECISION DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_pass RECORD;
    v_passenger RECORD;
    v_trip RECORD;
    v_now TIMESTAMPTZ := NOW();
BEGIN
    -- 1. Validate Trip and Driver Assignment
    SELECT id, driver_id, status, route_id
    INTO v_trip
    FROM trips
    WHERE id = p_trip_id;

    IF v_trip.id IS NULL THEN
        INSERT INTO qr_authentication_logs (pass_id, trip_id, driver_id, scan_result, rejection_reason, client_latitude, client_longitude)
        VALUES (p_pass_id, p_trip_id, p_driver_id, 'NOT_AUTHORIZED', 'TRIP_NOT_FOUND', p_client_lat, p_client_lng);

        RETURN jsonb_build_object('authorized', false, 'reason', 'TRIP_NOT_FOUND', 'message', 'Trip does not exist.');
    END IF;

    IF v_trip.driver_id <> p_driver_id THEN
        INSERT INTO qr_authentication_logs (pass_id, trip_id, driver_id, scan_result, rejection_reason, client_latitude, client_longitude)
        VALUES (p_pass_id, p_trip_id, p_driver_id, 'NOT_AUTHORIZED', 'UNAUTHORIZED_DRIVER', p_client_lat, p_client_lng);

        RETURN jsonb_build_object('authorized', false, 'reason', 'UNAUTHORIZED_DRIVER', 'message', 'Driver not assigned to this trip.');
    END IF;

    -- 2. Lock Pass row
    SELECT id, student_id, trip_id, route_id, pickup_point_id, valid_until, status, pass_date
    INTO v_pass
    FROM daily_travel_passes
    WHERE id = p_pass_id
    FOR UPDATE;

    IF v_pass.id IS NULL THEN
        INSERT INTO qr_authentication_logs (pass_id, trip_id, driver_id, scan_result, rejection_reason, client_latitude, client_longitude)
        VALUES (p_pass_id, p_trip_id, p_driver_id, 'NOT_AUTHORIZED', 'INVALID_PASS_ID', p_client_lat, p_client_lng);

        RETURN jsonb_build_object('authorized', false, 'reason', 'INVALID_PASS_ID', 'message', 'Pass not recognized.');
    END IF;

    -- Check if Pass is already used
    IF v_pass.status = 'USED' THEN
        INSERT INTO qr_authentication_logs (pass_id, trip_id, student_id, driver_id, scan_result, rejection_reason, client_latitude, client_longitude)
        VALUES (p_pass_id, p_trip_id, v_pass.student_id, p_driver_id, 'NOT_AUTHORIZED', 'ALREADY_USED', p_client_lat, p_client_lng);

        RETURN jsonb_build_object('authorized', false, 'reason', 'ALREADY_USED', 'message', 'Pass has already been used for boarding.');
    END IF;

    -- Check Pass status
    IF v_pass.status <> 'ACTIVE' THEN
        INSERT INTO qr_authentication_logs (pass_id, trip_id, student_id, driver_id, scan_result, rejection_reason, client_latitude, client_longitude)
        VALUES (p_pass_id, p_trip_id, v_pass.student_id, p_driver_id, 'NOT_AUTHORIZED', 'PASS_INACTIVE', p_client_lat, p_client_lng);

        RETURN jsonb_build_object('authorized', false, 'reason', 'PASS_INACTIVE', 'message', 'Pass is no longer active.');
    END IF;

    -- Check Expiration
    IF v_pass.valid_until < v_now THEN
        UPDATE daily_travel_passes SET status = 'EXPIRED' WHERE id = p_pass_id;

        INSERT INTO qr_authentication_logs (pass_id, trip_id, student_id, driver_id, scan_result, rejection_reason, client_latitude, client_longitude)
        VALUES (p_pass_id, p_trip_id, v_pass.student_id, p_driver_id, 'NOT_AUTHORIZED', 'PASS_EXPIRED', p_client_lat, p_client_lng);

        RETURN jsonb_build_object('authorized', false, 'reason', 'PASS_EXPIRED', 'message', 'Pass expired.');
    END IF;

    -- Check Trip Match
    IF v_pass.trip_id <> p_trip_id THEN
        INSERT INTO qr_authentication_logs (pass_id, trip_id, student_id, driver_id, scan_result, rejection_reason, client_latitude, client_longitude)
        VALUES (p_pass_id, p_trip_id, v_pass.student_id, p_driver_id, 'NOT_AUTHORIZED', 'WRONG_TRIP', p_client_lat, p_client_lng);

        RETURN jsonb_build_object('authorized', false, 'reason', 'WRONG_TRIP', 'message', 'Pass is for a different trip.');
    END IF;

    -- 3. Update Pass to USED and Passenger Manifest to BOARDED
    UPDATE daily_travel_passes
    SET status = 'USED', used_at = v_now
    WHERE id = p_pass_id;

    UPDATE trip_passengers
    SET status = 'BOARDED', boarded_at = v_now, verified_by_driver_id = p_driver_id
    WHERE trip_id = p_trip_id AND student_id = v_pass.student_id;

    UPDATE trips
    SET boarded_passengers = boarded_passengers + 1
    WHERE id = p_trip_id;

    -- 4. Log successful scan
    INSERT INTO qr_authentication_logs (
        pass_id, trip_id, student_id, driver_id, scan_result, rejection_reason, client_latitude, client_longitude
    ) VALUES (
        p_pass_id, p_trip_id, v_pass.student_id, p_driver_id, 'AUTHORIZED', NULL, p_client_lat, p_client_lng
    );

    RETURN jsonb_build_object(
        'authorized', true,
        'student_id', v_pass.student_id,
        'pickup_point_id', v_pass.pickup_point_id,
        'boarded_at', v_now,
        'message', 'Passenger successfully verified and boarded.'
    );
END;
$$ LANGUAGE plpgsql;

-- ----------------------------------------------------------------------------
-- 4. Driver Rating Recalculation Trigger
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_recalculate_driver_rating()
RETURNS TRIGGER AS $$
DECLARE
    v_avg NUMERIC(3, 2);
    v_count INTEGER;
BEGIN
    SELECT AVG(rating_stars)::NUMERIC(3, 2), COUNT(*)
    INTO v_avg, v_count
    FROM ratings
    WHERE driver_id = NEW.driver_id;

    UPDATE driver_profiles
    SET rating_avg = COALESCE(v_avg, 5.00),
        total_trips = v_count
    WHERE id = NEW.driver_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_after_rating_insert ON ratings;
CREATE TRIGGER trg_after_rating_insert
AFTER INSERT OR UPDATE ON ratings
FOR EACH ROW
EXECUTE FUNCTION fn_recalculate_driver_rating();
