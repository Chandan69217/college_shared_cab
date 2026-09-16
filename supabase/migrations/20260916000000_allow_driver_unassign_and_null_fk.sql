-- ============================================================================
-- College Shared Cab & Shuttle Platform - Driver Deletion & Safe Auto-Unassignment
-- Migration: 20260916000000_allow_driver_unassign_and_null_fk.sql
-- Database: PostgreSQL (Supabase Compatible)
-- ============================================================================

BEGIN;

-- 1. Allow trips.driver_id to be NULL and update foreign key constraint with ON DELETE SET NULL
ALTER TABLE trips ALTER COLUMN driver_id DROP NOT NULL;

ALTER TABLE trips
    DROP CONSTRAINT IF EXISTS trips_driver_id_fkey;

ALTER TABLE trips
    ADD CONSTRAINT trips_driver_id_fkey
        FOREIGN KEY (driver_id) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE;

-- 2. Allow delay_reports.driver_id to be NULL and update foreign key constraint with ON DELETE SET NULL
ALTER TABLE delay_reports ALTER COLUMN driver_id DROP NOT NULL;

ALTER TABLE delay_reports
    DROP CONSTRAINT IF EXISTS delay_reports_driver_id_fkey;

ALTER TABLE delay_reports
    ADD CONSTRAINT delay_reports_driver_id_fkey
        FOREIGN KEY (driver_id) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE;

-- 3. Update rating trigger to safely ignore null driver_id
CREATE OR REPLACE FUNCTION fn_recalculate_driver_rating()
RETURNS TRIGGER AS $$
DECLARE
    v_avg NUMERIC(3, 2);
    v_count INTEGER;
BEGIN
    IF NEW.driver_id IS NOT NULL THEN
        SELECT AVG(rating_stars)::NUMERIC(3, 2), COUNT(*)
        INTO v_avg, v_count
        FROM ratings
        WHERE driver_id = NEW.driver_id;

        UPDATE driver_profiles
        SET rating_avg = COALESCE(v_avg, 5.00),
            total_trips = v_count
        WHERE id = NEW.driver_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMIT;
