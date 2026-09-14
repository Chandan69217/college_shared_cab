-- ============================================================================
-- College Shared Cab & Shuttle Platform - Seed Data
-- Seed: seed.sql
-- Default Demo Password for all seed users: password123
-- Hash ($2a$10$4n9uA2n4wZtO1QZkR7YnQ.j7o5o5Z1hI6XgY7u9i1f4k9l5m3p6e):
-- Password bcrypt: $2a$10$w8T9H6kXq5mY7eY2Zf2KueE0XN2Z8Zz7HwI2B0C4M6Q8E0W2Z8Y6K
-- (The backend auth service also handles demo credentials reliably)
-- ============================================================================

-- Fixed UUIDs for predictable reference
DO $$
DECLARE
    v_college_id UUID := '11111111-1111-1111-1111-111111111111';
    v_admin_id UUID := 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
    v_driver1_id UUID := 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
    v_driver2_id UUID := 'cccccccc-cccc-cccc-cccc-cccccccccccc';
    v_student1_id UUID := 'dddddddd-dddd-dddd-dddd-dddddddddddd';
    v_student2_id UUID := 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee';
    
    v_pickup1_id UUID := '22222222-2222-2222-2222-222222222221';
    v_pickup2_id UUID := '22222222-2222-2222-2222-222222222222';
    v_pickup3_id UUID := '22222222-2222-2222-2222-222222222223';
    v_pickup4_id UUID := '22222222-2222-2222-2222-222222222224';
    v_pickup5_id UUID := '22222222-2222-2222-2222-222222222225';
    v_pickup6_id UUID := '22222222-2222-2222-2222-222222222226';
    v_pickup7_id UUID := '22222222-2222-2222-2222-222222222227';
    v_pickup8_out_id UUID := '22222222-2222-2222-2222-222222222228';

    v_veh1_id UUID := '33333333-3333-3333-3333-333333333331';
    v_veh2_id UUID := '33333333-3333-3333-3333-333333333332';
    v_veh3_id UUID := '33333333-3333-3333-3333-333333333333';

    v_route1_id UUID := '44444444-4444-4444-4444-444444444441';
    v_route2_id UUID := '44444444-4444-4444-4444-444444444442';

    v_plan_basic_id UUID := '55555555-5555-5555-5555-555555555551';
    v_plan_std_id UUID := '55555555-5555-5555-5555-555555555552';
    v_plan_prem_id UUID := '55555555-5555-5555-5555-555555555553';

    v_sub1_id UUID := '66666666-6666-6666-6666-666666666661';
    v_trip1_id UUID := '77777777-7777-7777-7777-777777777771';
    v_booking1_id UUID := '88888888-8888-8888-8888-888888888881';
    v_pass1_id UUID := '99999999-9999-9999-9999-999999999991';
    v_pay1_id UUID := 'aaaaaaaa-1111-2222-3333-444444444444';
    
    v_pw_hash TEXT := '$2a$10$w8T9H6kXq5mY7eY2Zf2KueE0XN2Z8Zz7HwI2B0C4M6Q8E0W2Z8Y6K';
BEGIN
    -- 1. Insert Demo College
    INSERT INTO colleges (id, name, code, address, latitude, longitude, service_radius_km, contact_email, contact_phone, is_active)
    VALUES (
        v_college_id,
        'Apex Institute of Technology & Management',
        'APEX-DELHI-NCR',
        'Sector 125, Knowledge Park Expressway, Noida, UP 201301',
        28.5355,
        77.3910,
        10.0,
        'transport@apexinstitute.edu.in',
        '+91 98765 43210',
        TRUE
    ) ON CONFLICT (id) DO NOTHING;

    -- 2. Insert Users (Admin, Drivers, Students)
    -- Admin
    INSERT INTO users (id, email, phone, full_name, password_hash, role, status)
    VALUES (v_admin_id, 'admin@collegecab.com', '+919999900001', 'Prof. Vikram Malhotra (Admin)', v_pw_hash, 'ADMIN', 'ACTIVE')
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO admin_profiles (id, full_name, department, permissions)
    VALUES (v_admin_id, 'Prof. Vikram Malhotra', 'Transport & Facilities Directorate', '["ALL"]'::jsonb)
    ON CONFLICT (id) DO NOTHING;

    -- Driver 1
    INSERT INTO users (id, email, phone, full_name, password_hash, role, status)
    VALUES (v_driver1_id, 'driver1@collegecab.com', '+919999900002', 'Rajesh Kumar Yadav', v_pw_hash, 'DRIVER', 'ACTIVE')
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO driver_profiles (id, college_id, license_number, license_expiry, aadhar_number, experience_years, status, rating_avg, total_trips)
    VALUES (v_driver1_id, v_college_id, 'DL-04-2018-8849201', '2030-05-15', '4521-8932-1092', 8, 'ACTIVE', 4.92, 420)
    ON CONFLICT (id) DO NOTHING;

    -- Driver 2
    INSERT INTO users (id, email, phone, full_name, password_hash, role, status)
    VALUES (v_driver2_id, 'driver2@collegecab.com', '+919999900003', 'Suresh Chandra Verma', v_pw_hash, 'DRIVER', 'ACTIVE')
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO driver_profiles (id, college_id, license_number, license_expiry, aadhar_number, experience_years, status, rating_avg, total_trips)
    VALUES (v_driver2_id, v_college_id, 'UP-16-2019-3391840', '2029-11-20', '8839-2041-9923', 5, 'ACTIVE', 4.85, 290)
    ON CONFLICT (id) DO NOTHING;

    -- Student 1 (Verified)
    INSERT INTO users (id, email, phone, full_name, password_hash, role, status)
    VALUES (v_student1_id, 'student1@college.edu', '+919999900004', 'Aarav Sharma', v_pw_hash, 'STUDENT', 'ACTIVE')
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO student_profiles (id, college_id, student_id_number, roll_number, course, semester, verification_status, verified_at, verified_by)
    VALUES (v_student1_id, v_college_id, 'STU-2024-BTECH-CS-042', '24BCS042', 'B.Tech Computer Science & Engineering', 5, 'VERIFIED', NOW() - INTERVAL '30 days', v_admin_id)
    ON CONFLICT (id) DO NOTHING;

    -- Student 2 (Pending)
    INSERT INTO users (id, email, phone, full_name, password_hash, role, status)
    VALUES (v_student2_id, 'student2@college.edu', '+919999900005', 'Ananya Patel', v_pw_hash, 'STUDENT', 'ACTIVE')
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO student_profiles (id, college_id, student_id_number, roll_number, course, semester, verification_status)
    VALUES (v_student2_id, v_college_id, 'STU-2025-MBA-MKT-019', '25MBA019', 'MBA International Business', 2, 'PENDING')
    ON CONFLICT (id) DO NOTHING;

    -- 3. Insert Pickup Points (within 10km radius & 1 outside for validation testing)
    INSERT INTO pickup_points (id, college_id, name, landmark, address, latitude, longitude, distance_to_college_km, is_approved, is_active)
    VALUES
    (v_pickup1_id, v_college_id, 'Sector 18 Metro Gate 2', 'Near Wave Mall & Atta Market', 'Sector 18 Metro Station, Noida', 28.5708, 77.3260, 4.8, TRUE, TRUE),
    (v_pickup2_id, v_college_id, 'Botanical Garden Interchange', 'Gate No 1, Main Auto Stand', 'Botanical Garden Metro Station, Noida', 28.5645, 77.3345, 3.6, TRUE, TRUE),
    (v_pickup3_id, v_college_id, 'Amity Gate 4 Crossing', 'Opposite Gate 4 Petrol Pump', 'Sector 125, Noida', 28.5420, 77.3360, 1.2, TRUE, TRUE),
    (v_pickup4_id, v_college_id, 'Golf Course Crossing', 'Under the Flyover, Captain Gaur Marg', 'Sector 37, Noida', 28.5670, 77.3480, 3.9, TRUE, TRUE),
    (v_pickup5_id, v_college_id, 'Sector 62 IT Hub / Electronic City', 'Near Fortis Hospital Junction', 'Sector 62, Noida', 28.6280, 77.3680, 8.2, TRUE, TRUE),
    (v_pickup6_id, v_college_id, 'Sector 137 Expressway Metro', 'Exit Gate 2, Paras Tierea side', 'Sector 137, Noida', 28.5020, 77.4080, 4.5, TRUE, TRUE),
    (v_pickup7_id, v_college_id, 'Knowledge Park 2 Metro', 'Near Sharda University Circle', 'Knowledge Park 2, Greater Noida', 28.4680, 77.4980, 9.4, TRUE, TRUE),
    (v_pickup8_out_id, v_college_id, 'Pari Chowk Bus Terminal', 'Opposite Ansal Plaza', 'Pari Chowk, Greater Noida', 28.4650, 77.5120, 12.8, FALSE, TRUE)
    ON CONFLICT (id) DO NOTHING;

    -- 4. Insert Vehicles
    INSERT INTO vehicles (id, college_id, vehicle_number, model, type, seating_capacity, registration_number, insurance_validity, fitness_validity, status)
    VALUES
    (v_veh1_id, v_college_id, 'UP16-CZ-8821', 'Maruti Suzuki Ertiga VXi (CNG)', 'CAB_6', 6, 'DL-VA-2023-9921', '2028-12-31', '2028-12-31', 'ACTIVE'),
    (v_veh2_id, v_college_id, 'UP16-EV-4412', 'Toyota Innova Crysta 2.4 VX', 'CAB_6', 6, 'DL-VA-2024-1102', '2029-04-30', '2029-04-30', 'ACTIVE'),
    (v_veh3_id, v_college_id, 'UP16-TR-7700', 'Force Traveller Executive 3350', 'SHUTTLE_12', 12, 'DL-VA-2022-7700', '2027-08-15', '2027-08-15', 'ACTIVE')
    ON CONFLICT (id) DO NOTHING;

    -- 5. Insert Routes
    INSERT INTO routes (id, college_id, name, code, description, morning_departure_time, evening_departure_time, estimated_duration_mins, default_vehicle_id, default_driver_id, max_capacity, is_active)
    VALUES
    (v_route1_id, v_college_id, 'Route 1: Central Metro Express', 'R1-METRO-EXP', 'Sector 18 Metro -> Botanical Garden -> Amity -> College', '07:30:00', '17:00:00', 40, v_veh1_id, v_driver1_id, 6, TRUE),
    (v_route2_id, v_college_id, 'Route 2: Expressway Shuttle Corridor', 'R2-EXP-CORR', 'Sector 62 -> Sector 137 -> Knowledge Park -> College', '07:45:00', '17:15:00', 50, v_veh3_id, v_driver2_id, 12, TRUE)
    ON CONFLICT (id) DO NOTHING;

    -- Route stops
    INSERT INTO route_pickup_points (route_id, pickup_point_id, sequence_order, morning_pickup_time, evening_drop_time)
    VALUES
    (v_route1_id, v_pickup1_id, 1, '07:30:00', '17:40:00'),
    (v_route1_id, v_pickup2_id, 2, '07:40:00', '17:30:00'),
    (v_route1_id, v_pickup3_id, 3, '07:50:00', '17:20:00'),
    (v_route2_id, v_pickup5_id, 1, '07:45:00', '18:00:00'),
    (v_route2_id, v_pickup6_id, 2, '08:05:00', '17:40:00'),
    (v_route2_id, v_pickup7_id, 3, '08:20:00', '17:25:00')
    ON CONFLICT DO NOTHING;

    -- 6. Insert Subscription Plans
    INSERT INTO subscription_plans (id, college_id, tier, name, description, price, validity_days, ride_count_total, is_unlimited_rides, priority_booking, one_way_allowed, round_trip_allowed, cancellation_hours_limit, cancellation_fee_percentage, additional_ride_charge, status)
    VALUES
    (v_plan_basic_id, v_college_id, 'BASIC', 'Basic Shuttle Pass', 'Ideal for students traveling one-way or 3-4 days a week. Includes 22 trips.', 1499.00, 30, 22, FALSE, FALSE, TRUE, FALSE, 4, 15.00, 60.00, 'ACTIVE'),
    (v_plan_std_id, v_college_id, 'STANDARD', 'Standard Daily Commuter Pass', 'Best value for daily regular college commute (morning pickup + evening return). 44 rides with free reschedule.', 2499.00, 30, 44, FALSE, FALSE, TRUE, TRUE, 2, 10.00, 50.00, 'ACTIVE'),
    (v_plan_prem_id, v_college_id, 'PREMIUM', 'Premium Unlimited Club Pass', 'Ultimate flexibility: Priority seat reservation, air-conditioned executive cabs, and zero-fee instant cancellation.', 3499.00, 30, 60, TRUE, TRUE, TRUE, TRUE, 1, 0.00, 40.00, 'ACTIVE')
    ON CONFLICT (id) DO NOTHING;

    -- 7. Insert Payment and Active Subscription for Student 1
    INSERT INTO payments (id, student_id, amount, currency, payment_method, transaction_id, gateway_order_id, status, receipt_number)
    VALUES (v_pay1_id, v_student1_id, 2499.00, 'INR', 'UPI', 'TXN-UPI-2026-9812401', 'order_demo_9921', 'SUCCESS', 'RCPT-2026-0812')
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO subscriptions (id, student_id, plan_id, start_date, end_date, total_rides_allocated, remaining_rides, status, payment_id, auto_renew)
    VALUES (v_sub1_id, v_student1_id, v_plan_std_id, CURRENT_DATE - INTERVAL '5 days', CURRENT_DATE + INTERVAL '25 days', 44, 38, 'ACTIVE', v_pay1_id, FALSE)
    ON CONFLICT (id) DO NOTHING;

    -- 8. Insert Today's Scheduled Trip
    INSERT INTO trips (id, route_id, vehicle_id, driver_id, trip_date, trip_type, scheduled_departure_time, status, max_capacity, booked_seats, boarded_passengers, live_latitude, live_longitude, last_gps_update)
    VALUES (v_trip1_id, v_route1_id, v_veh1_id, v_driver1_id, CURRENT_DATE, 'MORNING_PICKUP', '07:30:00', 'SCHEDULED', 6, 1, 0, 28.5708, 77.3260, NOW())
    ON CONFLICT (id) DO NOTHING;

    -- 9. Insert Confirmed Booking & Daily Travel Pass for Student 1
    INSERT INTO bookings (id, student_id, subscription_id, trip_id, route_id, pickup_point_id, booking_date, trip_type, seat_number, status)
    VALUES (v_booking1_id, v_student1_id, v_sub1_id, v_trip1_id, v_route1_id, v_pickup1_id, CURRENT_DATE, 'MORNING_PICKUP', 1, 'CONFIRMED')
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO trip_passengers (trip_id, booking_id, student_id, pickup_point_id, status)
    VALUES (v_trip1_id, v_booking1_id, v_student1_id, v_pickup1_id, 'WAITING')
    ON CONFLICT (trip_id, student_id) DO NOTHING;

    INSERT INTO daily_travel_passes (id, student_id, booking_id, trip_id, pass_date, trip_type, route_id, pickup_point_id, auth_token_hash, valid_until, status)
    VALUES (
        v_pass1_id,
        v_student1_id,
        v_booking1_id,
        v_trip1_id,
        CURRENT_DATE,
        'MORNING_PICKUP',
        v_route1_id,
        v_pickup1_id,
        'DEMO_TOKEN_HASH_AARAV_PASS_01',
        (CURRENT_DATE + TIME '10:00:00')::TIMESTAMPTZ,
        'ACTIVE'
    ) ON CONFLICT (id) DO NOTHING;

    -- 10. Notifications & Sample Complaints
    INSERT INTO notifications (user_id, title, message, type, is_read, data)
    VALUES
    (v_student1_id, 'Booking Confirmed for Today!', 'Your morning cab for Route 1 (Sector 18 Metro) is confirmed. Boarding time: 07:30 AM.', 'BOOKING', FALSE, '{"tripId": "77777777-7777-7777-7777-777777777771"}'::jsonb),
    (v_student1_id, 'Subscription Active', 'Standard Daily Commuter Pass (44 rides) is active until 30 days.', 'SUBSCRIPTION', TRUE, '{}'::jsonb);

    INSERT INTO complaints (ticket_number, student_id, category, subject, description, priority, status)
    VALUES
    ('TKT-2026-0041', v_student1_id, 'VEHICLE', 'AC cooling was low yesterday', 'The air conditioning in vehicle UP16-CZ-8821 was inadequate during afternoon travel.', 'MEDIUM', 'OPEN');

    -- 11. College Holidays
    INSERT INTO college_holidays (college_id, holiday_date, title, holiday_type, is_service_disabled)
    VALUES
    (v_college_id, CURRENT_DATE + INTERVAL '12 days', 'Gandhi Jayanti', 'COLLEGE_HOLIDAY', TRUE),
    (v_college_id, CURRENT_DATE + INTERVAL '24 days', 'Mid-Semester Exam Prep Day', 'EXAM_HOLIDAY', FALSE)
    ON CONFLICT (college_id, holiday_date) DO NOTHING;

END $$;
