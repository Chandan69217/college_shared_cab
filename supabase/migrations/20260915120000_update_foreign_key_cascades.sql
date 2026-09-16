-- ============================================================================
-- College Shared Cab & Shuttle Platform - Foreign Key Cascades & Referential Integrity
-- Migration: 20260915120000_update_foreign_key_cascades.sql
-- Database: PostgreSQL (Supabase Compatible)
-- ============================================================================

-- Wrap everything in a transaction for safety
BEGIN;

-- ----------------------------------------------------------------------------
-- 1. Alter Column Nullability for Financial & Audit Retention Tables
-- (Allows ON DELETE SET NULL to preserve financial records when users are removed)
-- ----------------------------------------------------------------------------

-- Payments: Allow student_id to be nullable if a user account is deleted/archived
ALTER TABLE payments ALTER COLUMN student_id DROP NOT NULL;

-- Refunds: Allow student_id to be nullable
ALTER TABLE refunds ALTER COLUMN student_id DROP NOT NULL;

-- Complaints: Allow student_id to be nullable
ALTER TABLE complaints ALTER COLUMN student_id DROP NOT NULL;

-- Ratings: Allow student_id and driver_id to be nullable
ALTER TABLE ratings ALTER COLUMN student_id DROP NOT NULL;
ALTER TABLE ratings ALTER COLUMN driver_id DROP NOT NULL;

-- Ride History: Allow student_id, trip_id, booking_id to be nullable
ALTER TABLE ride_history ALTER COLUMN student_id DROP NOT NULL;
ALTER TABLE ride_history ALTER COLUMN trip_id DROP NOT NULL;
ALTER TABLE ride_history ALTER COLUMN booking_id DROP NOT NULL;

-- QR Authentication Logs: Allow trip_id and driver_id to be nullable
ALTER TABLE qr_authentication_logs ALTER COLUMN trip_id DROP NOT NULL;
ALTER TABLE qr_authentication_logs ALTER COLUMN driver_id DROP NOT NULL;

-- ----------------------------------------------------------------------------
-- 2. Drop and Recreate Foreign Key Constraints with Cascade & Restrict Rules
-- ----------------------------------------------------------------------------

-- Table: student_profiles
ALTER TABLE student_profiles
    DROP CONSTRAINT IF EXISTS student_profiles_id_fkey,
    DROP CONSTRAINT IF EXISTS student_profiles_college_id_fkey,
    DROP CONSTRAINT IF EXISTS student_profiles_verified_by_fkey;

ALTER TABLE student_profiles
    ADD CONSTRAINT student_profiles_id_fkey
        FOREIGN KEY (id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    ADD CONSTRAINT student_profiles_college_id_fkey
        FOREIGN KEY (college_id) REFERENCES colleges(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    ADD CONSTRAINT student_profiles_verified_by_fkey
        FOREIGN KEY (verified_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE;

-- Table: driver_profiles
ALTER TABLE driver_profiles
    DROP CONSTRAINT IF EXISTS driver_profiles_id_fkey,
    DROP CONSTRAINT IF EXISTS driver_profiles_college_id_fkey;

ALTER TABLE driver_profiles
    ADD CONSTRAINT driver_profiles_id_fkey
        FOREIGN KEY (id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    ADD CONSTRAINT driver_profiles_college_id_fkey
        FOREIGN KEY (college_id) REFERENCES colleges(id) ON DELETE RESTRICT ON UPDATE CASCADE;

-- Table: admin_profiles
ALTER TABLE admin_profiles
    DROP CONSTRAINT IF EXISTS admin_profiles_id_fkey;

ALTER TABLE admin_profiles
    ADD CONSTRAINT admin_profiles_id_fkey
        FOREIGN KEY (id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE;

-- Table: pickup_points
ALTER TABLE pickup_points
    DROP CONSTRAINT IF EXISTS pickup_points_college_id_fkey;

ALTER TABLE pickup_points
    ADD CONSTRAINT pickup_points_college_id_fkey
        FOREIGN KEY (college_id) REFERENCES colleges(id) ON DELETE CASCADE ON UPDATE CASCADE;

-- Table: vehicles
ALTER TABLE vehicles
    DROP CONSTRAINT IF EXISTS vehicles_college_id_fkey;

ALTER TABLE vehicles
    ADD CONSTRAINT vehicles_college_id_fkey
        FOREIGN KEY (college_id) REFERENCES colleges(id) ON DELETE RESTRICT ON UPDATE CASCADE;

-- Table: routes
ALTER TABLE routes
    DROP CONSTRAINT IF EXISTS routes_college_id_fkey,
    DROP CONSTRAINT IF EXISTS routes_default_vehicle_id_fkey,
    DROP CONSTRAINT IF EXISTS routes_default_driver_id_fkey;

ALTER TABLE routes
    ADD CONSTRAINT routes_college_id_fkey
        FOREIGN KEY (college_id) REFERENCES colleges(id) ON DELETE CASCADE ON UPDATE CASCADE,
    ADD CONSTRAINT routes_default_vehicle_id_fkey
        FOREIGN KEY (default_vehicle_id) REFERENCES vehicles(id) ON DELETE SET NULL ON UPDATE CASCADE,
    ADD CONSTRAINT routes_default_driver_id_fkey
        FOREIGN KEY (default_driver_id) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE;

-- Table: route_pickup_points (Junction table: delete route -> delete stop assignment; delete pickup_point -> delete stop assignment)
ALTER TABLE route_pickup_points
    DROP CONSTRAINT IF EXISTS route_pickup_points_route_id_fkey,
    DROP CONSTRAINT IF EXISTS route_pickup_points_pickup_point_id_fkey;

ALTER TABLE route_pickup_points
    ADD CONSTRAINT route_pickup_points_route_id_fkey
        FOREIGN KEY (route_id) REFERENCES routes(id) ON DELETE CASCADE ON UPDATE CASCADE,
    ADD CONSTRAINT route_pickup_points_pickup_point_id_fkey
        FOREIGN KEY (pickup_point_id) REFERENCES pickup_points(id) ON DELETE CASCADE ON UPDATE CASCADE;

-- Table: subscription_plans
ALTER TABLE subscription_plans
    DROP CONSTRAINT IF EXISTS subscription_plans_college_id_fkey;

ALTER TABLE subscription_plans
    ADD CONSTRAINT subscription_plans_college_id_fkey
        FOREIGN KEY (college_id) REFERENCES colleges(id) ON DELETE CASCADE ON UPDATE CASCADE;

-- Table: subscriptions
ALTER TABLE subscriptions
    DROP CONSTRAINT IF EXISTS subscriptions_student_id_fkey,
    DROP CONSTRAINT IF EXISTS subscriptions_plan_id_fkey,
    DROP CONSTRAINT IF EXISTS fk_subscription_payment;

ALTER TABLE subscriptions
    ADD CONSTRAINT subscriptions_student_id_fkey
        FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    ADD CONSTRAINT subscriptions_plan_id_fkey
        FOREIGN KEY (plan_id) REFERENCES subscription_plans(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    ADD CONSTRAINT fk_subscription_payment
        FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE SET NULL ON UPDATE CASCADE;

-- Table: trips (Core operational entity)
ALTER TABLE trips
    DROP CONSTRAINT IF EXISTS trips_route_id_fkey,
    DROP CONSTRAINT IF EXISTS trips_vehicle_id_fkey,
    DROP CONSTRAINT IF EXISTS trips_driver_id_fkey;

ALTER TABLE trips
    ADD CONSTRAINT trips_route_id_fkey
        FOREIGN KEY (route_id) REFERENCES routes(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    ADD CONSTRAINT trips_vehicle_id_fkey
        FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    ADD CONSTRAINT trips_driver_id_fkey
        FOREIGN KEY (driver_id) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE;

-- Table: bookings
ALTER TABLE bookings
    DROP CONSTRAINT IF EXISTS bookings_student_id_fkey,
    DROP CONSTRAINT IF EXISTS bookings_subscription_id_fkey,
    DROP CONSTRAINT IF EXISTS bookings_trip_id_fkey,
    DROP CONSTRAINT IF EXISTS bookings_route_id_fkey,
    DROP CONSTRAINT IF EXISTS bookings_pickup_point_id_fkey;

ALTER TABLE bookings
    ADD CONSTRAINT bookings_student_id_fkey
        FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    ADD CONSTRAINT bookings_subscription_id_fkey
        FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE CASCADE ON UPDATE CASCADE,
    ADD CONSTRAINT bookings_trip_id_fkey
        FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE ON UPDATE CASCADE,
    ADD CONSTRAINT bookings_route_id_fkey
        FOREIGN KEY (route_id) REFERENCES routes(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    ADD CONSTRAINT bookings_pickup_point_id_fkey
        FOREIGN KEY (pickup_point_id) REFERENCES pickup_points(id) ON DELETE RESTRICT ON UPDATE CASCADE;

-- Table: trip_passengers (Manifest)
ALTER TABLE trip_passengers
    DROP CONSTRAINT IF EXISTS trip_passengers_trip_id_fkey,
    DROP CONSTRAINT IF EXISTS trip_passengers_booking_id_fkey,
    DROP CONSTRAINT IF EXISTS trip_passengers_student_id_fkey,
    DROP CONSTRAINT IF EXISTS trip_passengers_pickup_point_id_fkey,
    DROP CONSTRAINT IF EXISTS trip_passengers_verified_by_driver_id_fkey;

ALTER TABLE trip_passengers
    ADD CONSTRAINT trip_passengers_trip_id_fkey
        FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE ON UPDATE CASCADE,
    ADD CONSTRAINT trip_passengers_booking_id_fkey
        FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE ON UPDATE CASCADE,
    ADD CONSTRAINT trip_passengers_student_id_fkey
        FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    ADD CONSTRAINT trip_passengers_pickup_point_id_fkey
        FOREIGN KEY (pickup_point_id) REFERENCES pickup_points(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    ADD CONSTRAINT trip_passengers_verified_by_driver_id_fkey
        FOREIGN KEY (verified_by_driver_id) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE;

-- Table: daily_travel_passes
ALTER TABLE daily_travel_passes
    DROP CONSTRAINT IF EXISTS daily_travel_passes_student_id_fkey,
    DROP CONSTRAINT IF EXISTS daily_travel_passes_booking_id_fkey,
    DROP CONSTRAINT IF EXISTS daily_travel_passes_trip_id_fkey,
    DROP CONSTRAINT IF EXISTS daily_travel_passes_route_id_fkey,
    DROP CONSTRAINT IF EXISTS daily_travel_passes_pickup_point_id_fkey;

ALTER TABLE daily_travel_passes
    ADD CONSTRAINT daily_travel_passes_student_id_fkey
        FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    ADD CONSTRAINT daily_travel_passes_booking_id_fkey
        FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE ON UPDATE CASCADE,
    ADD CONSTRAINT daily_travel_passes_trip_id_fkey
        FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE ON UPDATE CASCADE,
    ADD CONSTRAINT daily_travel_passes_route_id_fkey
        FOREIGN KEY (route_id) REFERENCES routes(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    ADD CONSTRAINT daily_travel_passes_pickup_point_id_fkey
        FOREIGN KEY (pickup_point_id) REFERENCES pickup_points(id) ON DELETE RESTRICT ON UPDATE CASCADE;

-- Table: qr_authentication_logs (Audit log: preserve audit history)
ALTER TABLE qr_authentication_logs
    DROP CONSTRAINT IF EXISTS qr_authentication_logs_pass_id_fkey,
    DROP CONSTRAINT IF EXISTS qr_authentication_logs_trip_id_fkey,
    DROP CONSTRAINT IF EXISTS qr_authentication_logs_student_id_fkey,
    DROP CONSTRAINT IF EXISTS qr_authentication_logs_driver_id_fkey;

ALTER TABLE qr_authentication_logs
    ADD CONSTRAINT qr_authentication_logs_pass_id_fkey
        FOREIGN KEY (pass_id) REFERENCES daily_travel_passes(id) ON DELETE SET NULL ON UPDATE CASCADE,
    ADD CONSTRAINT qr_authentication_logs_trip_id_fkey
        FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE SET NULL ON UPDATE CASCADE,
    ADD CONSTRAINT qr_authentication_logs_student_id_fkey
        FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    ADD CONSTRAINT qr_authentication_logs_driver_id_fkey
        FOREIGN KEY (driver_id) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE;

-- Table: payments (Financial records: NEVER cascade delete)
ALTER TABLE payments
    DROP CONSTRAINT IF EXISTS payments_student_id_fkey,
    DROP CONSTRAINT IF EXISTS payments_subscription_id_fkey;

ALTER TABLE payments
    ADD CONSTRAINT payments_student_id_fkey
        FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    ADD CONSTRAINT payments_subscription_id_fkey
        FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE SET NULL ON UPDATE CASCADE;

-- Table: refunds (Financial records: preserve)
ALTER TABLE refunds
    DROP CONSTRAINT IF EXISTS refunds_payment_id_fkey,
    DROP CONSTRAINT IF EXISTS refunds_booking_id_fkey,
    DROP CONSTRAINT IF EXISTS refunds_student_id_fkey;

ALTER TABLE refunds
    ADD CONSTRAINT refunds_payment_id_fkey
        FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    ADD CONSTRAINT refunds_booking_id_fkey
        FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE SET NULL ON UPDATE CASCADE,
    ADD CONSTRAINT refunds_student_id_fkey
        FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE;

-- Table: vehicle_locations (Legacy GPS coordinates stream)
ALTER TABLE vehicle_locations
    DROP CONSTRAINT IF EXISTS vehicle_locations_vehicle_id_fkey,
    DROP CONSTRAINT IF EXISTS vehicle_locations_trip_id_fkey,
    DROP CONSTRAINT IF EXISTS vehicle_locations_driver_id_fkey;

ALTER TABLE vehicle_locations
    ADD CONSTRAINT vehicle_locations_vehicle_id_fkey
        FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE ON UPDATE CASCADE,
    ADD CONSTRAINT vehicle_locations_trip_id_fkey
        FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE ON UPDATE CASCADE,
    ADD CONSTRAINT vehicle_locations_driver_id_fkey
        FOREIGN KEY (driver_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE;

-- Table: vehicle_current_locations (Live telemetry)
ALTER TABLE vehicle_current_locations
    DROP CONSTRAINT IF EXISTS vehicle_current_locations_vehicle_id_fkey,
    DROP CONSTRAINT IF EXISTS vehicle_current_locations_trip_id_fkey,
    DROP CONSTRAINT IF EXISTS vehicle_current_locations_driver_id_fkey;

ALTER TABLE vehicle_current_locations
    ADD CONSTRAINT vehicle_current_locations_vehicle_id_fkey
        FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE ON UPDATE CASCADE,
    ADD CONSTRAINT vehicle_current_locations_trip_id_fkey
        FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE ON UPDATE CASCADE,
    ADD CONSTRAINT vehicle_current_locations_driver_id_fkey
        FOREIGN KEY (driver_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE;

-- Table: vehicle_location_history (Breadcrumb trail)
ALTER TABLE vehicle_location_history
    DROP CONSTRAINT IF EXISTS vehicle_location_history_vehicle_id_fkey,
    DROP CONSTRAINT IF EXISTS vehicle_location_history_trip_id_fkey,
    DROP CONSTRAINT IF EXISTS vehicle_location_history_driver_id_fkey;

ALTER TABLE vehicle_location_history
    ADD CONSTRAINT vehicle_location_history_vehicle_id_fkey
        FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE ON UPDATE CASCADE,
    ADD CONSTRAINT vehicle_location_history_trip_id_fkey
        FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE ON UPDATE CASCADE,
    ADD CONSTRAINT vehicle_location_history_driver_id_fkey
        FOREIGN KEY (driver_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE;

-- Table: notifications
ALTER TABLE notifications
    DROP CONSTRAINT IF EXISTS notifications_user_id_fkey;

ALTER TABLE notifications
    ADD CONSTRAINT notifications_user_id_fkey
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE;

-- Table: complaints (Support tickets: preserve history)
ALTER TABLE complaints
    DROP CONSTRAINT IF EXISTS complaints_student_id_fkey,
    DROP CONSTRAINT IF EXISTS complaints_resolved_by_fkey;

ALTER TABLE complaints
    ADD CONSTRAINT complaints_student_id_fkey
        FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    ADD CONSTRAINT complaints_resolved_by_fkey
        FOREIGN KEY (resolved_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE;

-- Table: ratings (Rating reviews: preserve driver analytics)
ALTER TABLE ratings
    DROP CONSTRAINT IF EXISTS ratings_trip_id_fkey,
    DROP CONSTRAINT IF EXISTS ratings_student_id_fkey,
    DROP CONSTRAINT IF EXISTS ratings_driver_id_fkey;

ALTER TABLE ratings
    ADD CONSTRAINT ratings_trip_id_fkey
        FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE ON UPDATE CASCADE,
    ADD CONSTRAINT ratings_student_id_fkey
        FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    ADD CONSTRAINT ratings_driver_id_fkey
        FOREIGN KEY (driver_id) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE;

-- Table: ride_history (Reporting: preserve history)
ALTER TABLE ride_history
    DROP CONSTRAINT IF EXISTS ride_history_student_id_fkey,
    DROP CONSTRAINT IF EXISTS ride_history_trip_id_fkey,
    DROP CONSTRAINT IF EXISTS ride_history_booking_id_fkey,
    DROP CONSTRAINT IF EXISTS ride_history_rating_id_fkey;

ALTER TABLE ride_history
    ADD CONSTRAINT ride_history_student_id_fkey
        FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    ADD CONSTRAINT ride_history_trip_id_fkey
        FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE SET NULL ON UPDATE CASCADE,
    ADD CONSTRAINT ride_history_booking_id_fkey
        FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE SET NULL ON UPDATE CASCADE,
    ADD CONSTRAINT ride_history_rating_id_fkey
        FOREIGN KEY (rating_id) REFERENCES ratings(id) ON DELETE SET NULL ON UPDATE CASCADE;

-- Table: college_holidays
ALTER TABLE college_holidays
    DROP CONSTRAINT IF EXISTS college_holidays_college_id_fkey;

ALTER TABLE college_holidays
    ADD CONSTRAINT college_holidays_college_id_fkey
        FOREIGN KEY (college_id) REFERENCES colleges(id) ON DELETE CASCADE ON UPDATE CASCADE;

-- Table: emergency_contacts
ALTER TABLE emergency_contacts
    DROP CONSTRAINT IF EXISTS emergency_contacts_user_id_fkey;

ALTER TABLE emergency_contacts
    ADD CONSTRAINT emergency_contacts_user_id_fkey
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE;

-- Table: audit_logs (System audit: preserve history)
ALTER TABLE audit_logs
    DROP CONSTRAINT IF EXISTS audit_logs_user_id_fkey;

ALTER TABLE audit_logs
    ADD CONSTRAINT audit_logs_user_id_fkey
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE;

COMMIT;
