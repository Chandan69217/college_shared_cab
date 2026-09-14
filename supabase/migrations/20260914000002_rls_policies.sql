-- ============================================================================
-- College Shared Cab & Shuttle Platform - Row Level Security (RLS) Policies
-- Migration: 20260914000002_rls_policies.sql
-- ============================================================================

-- Helper functions to get current user role & ID from auth.uid() or jwt claims
CREATE OR REPLACE FUNCTION auth_user_id()
RETURNS UUID AS $$
    SELECT NULLIF(current_setting('request.jwt.claim.sub', true), '')::UUID;
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION auth_user_role()
RETURNS TEXT AS $$
    SELECT NULLIF(current_setting('request.jwt.claim.role', true), '')::TEXT;
$$ LANGUAGE sql STABLE;

-- Enable RLS on all operational tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE colleges ENABLE ROW LEVEL SECURITY;
ALTER TABLE pickup_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE route_pickup_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_passengers ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_travel_passes ENABLE ROW LEVEL SECURITY;
ALTER TABLE qr_authentication_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE ride_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE college_holidays ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_locations ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- Public / Read-Only Catalogs (Colleges, Active Pickup Points, Active Routes, Plans, Holidays)
-- ----------------------------------------------------------------------------
CREATE POLICY policy_public_colleges ON colleges
    FOR SELECT USING (is_active = TRUE);

CREATE POLICY policy_public_pickup_points ON pickup_points
    FOR SELECT USING (is_active = TRUE AND is_approved = TRUE);

CREATE POLICY policy_public_routes ON routes
    FOR SELECT USING (is_active = TRUE);

CREATE POLICY policy_public_route_pickups ON route_pickup_points
    FOR SELECT USING (TRUE);

CREATE POLICY policy_public_subscription_plans ON subscription_plans
    FOR SELECT USING (status = 'ACTIVE');

CREATE POLICY policy_public_holidays ON college_holidays
    FOR SELECT USING (TRUE);

-- ----------------------------------------------------------------------------
-- Student Policies
-- ----------------------------------------------------------------------------
CREATE POLICY policy_student_own_user ON users
    FOR ALL USING (id = auth_user_id());

CREATE POLICY policy_student_own_profile ON student_profiles
    FOR ALL USING (id = auth_user_id());

CREATE POLICY policy_student_own_subscriptions ON subscriptions
    FOR SELECT USING (student_id = auth_user_id());

CREATE POLICY policy_student_own_bookings ON bookings
    FOR ALL USING (student_id = auth_user_id());

CREATE POLICY policy_student_own_passes ON daily_travel_passes
    FOR ALL USING (student_id = auth_user_id());

CREATE POLICY policy_student_own_payments ON payments
    FOR SELECT USING (student_id = auth_user_id());

CREATE POLICY policy_student_own_notifications ON notifications
    FOR ALL USING (user_id = auth_user_id());

CREATE POLICY policy_student_own_complaints ON complaints
    FOR ALL USING (student_id = auth_user_id());

CREATE POLICY policy_student_own_ratings ON ratings
    FOR ALL USING (student_id = auth_user_id());

CREATE POLICY policy_student_own_ride_history ON ride_history
    FOR SELECT USING (student_id = auth_user_id());

CREATE POLICY policy_student_own_emergency_contacts ON emergency_contacts
    FOR ALL USING (user_id = auth_user_id());

-- Students can read assigned trip and live vehicle location for their bookings
CREATE POLICY policy_student_view_trips ON trips
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM bookings b
            WHERE b.trip_id = trips.id AND b.student_id = auth_user_id()
        )
        OR status = 'SCHEDULED'
    );

CREATE POLICY policy_student_view_vehicle_locations ON vehicle_locations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM bookings b
            WHERE b.trip_id = vehicle_locations.trip_id AND b.student_id = auth_user_id()
        )
    );

-- ----------------------------------------------------------------------------
-- Driver Policies
-- ----------------------------------------------------------------------------
CREATE POLICY policy_driver_own_profile ON driver_profiles
    FOR ALL USING (id = auth_user_id());

CREATE POLICY policy_driver_assigned_trips ON trips
    FOR ALL USING (driver_id = auth_user_id());

CREATE POLICY policy_driver_trip_passengers ON trip_passengers
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM trips t
            WHERE t.id = trip_passengers.trip_id AND t.driver_id = auth_user_id()
        )
    );

CREATE POLICY policy_driver_insert_location ON vehicle_locations
    FOR INSERT WITH CHECK (driver_id = auth_user_id());

CREATE POLICY policy_driver_qr_logs ON qr_authentication_logs
    FOR ALL USING (driver_id = auth_user_id());

-- ----------------------------------------------------------------------------
-- Admin / Service-Role Full Access (Bypass through service_role or admin role check)
-- ----------------------------------------------------------------------------
CREATE POLICY policy_admin_all_users ON users FOR ALL USING (auth_user_role() = 'ADMIN');
CREATE POLICY policy_admin_all_student_profiles ON student_profiles FOR ALL USING (auth_user_role() = 'ADMIN');
CREATE POLICY policy_admin_all_driver_profiles ON driver_profiles FOR ALL USING (auth_user_role() = 'ADMIN');
CREATE POLICY policy_admin_all_admin_profiles ON admin_profiles FOR ALL USING (auth_user_role() = 'ADMIN');
CREATE POLICY policy_admin_all_colleges ON colleges FOR ALL USING (auth_user_role() = 'ADMIN');
CREATE POLICY policy_admin_all_pickup_points ON pickup_points FOR ALL USING (auth_user_role() = 'ADMIN');
CREATE POLICY policy_admin_all_routes ON routes FOR ALL USING (auth_user_role() = 'ADMIN');
CREATE POLICY policy_admin_all_route_pickups ON route_pickup_points FOR ALL USING (auth_user_role() = 'ADMIN');
CREATE POLICY policy_admin_all_vehicles ON vehicles FOR ALL USING (auth_user_role() = 'ADMIN');
CREATE POLICY policy_admin_all_plans ON subscription_plans FOR ALL USING (auth_user_role() = 'ADMIN');
CREATE POLICY policy_admin_all_subscriptions ON subscriptions FOR ALL USING (auth_user_role() = 'ADMIN');
CREATE POLICY policy_admin_all_trips ON trips FOR ALL USING (auth_user_role() = 'ADMIN');
CREATE POLICY policy_admin_all_bookings ON bookings FOR ALL USING (auth_user_role() = 'ADMIN');
CREATE POLICY policy_admin_all_trip_passengers ON trip_passengers FOR ALL USING (auth_user_role() = 'ADMIN');
CREATE POLICY policy_admin_all_passes ON daily_travel_passes FOR ALL USING (auth_user_role() = 'ADMIN');
CREATE POLICY policy_admin_all_qr_logs ON qr_authentication_logs FOR ALL USING (auth_user_role() = 'ADMIN');
CREATE POLICY policy_admin_all_payments ON payments FOR ALL USING (auth_user_role() = 'ADMIN');
CREATE POLICY policy_admin_all_refunds ON refunds FOR ALL USING (auth_user_role() = 'ADMIN');
CREATE POLICY policy_admin_all_complaints ON complaints FOR ALL USING (auth_user_role() = 'ADMIN');
CREATE POLICY policy_admin_all_ratings ON ratings FOR ALL USING (auth_user_role() = 'ADMIN');
CREATE POLICY policy_admin_all_holidays ON college_holidays FOR ALL USING (auth_user_role() = 'ADMIN');
