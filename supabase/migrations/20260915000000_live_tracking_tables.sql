-- ============================================================================
-- College Shared Cab & Shuttle Platform - Real-Time Vehicle Location Tracking
-- Migration: 20260915000000_live_tracking_tables.sql
-- Database: PostgreSQL (Supabase Compatible)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Table: vehicle_current_locations (Latest state per vehicle)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS vehicle_current_locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehicle_id UUID UNIQUE NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    driver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    accuracy DOUBLE PRECISION DEFAULT 5.0,
    speed DOUBLE PRECISION DEFAULT 0.0,
    heading DOUBLE PRECISION DEFAULT 0.0,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 2. Table: vehicle_location_history (Chronological audit / replay breadcrumbs)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS vehicle_location_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    driver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    accuracy DOUBLE PRECISION DEFAULT 5.0,
    speed DOUBLE PRECISION DEFAULT 0.0,
    heading DOUBLE PRECISION DEFAULT 0.0,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 3. Performance Indexes
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_vehicle_current_locations_vehicle ON vehicle_current_locations(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_current_locations_trip ON vehicle_current_locations(trip_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_current_locations_driver ON vehicle_current_locations(driver_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_current_locations_updated ON vehicle_current_locations(updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_vehicle_location_history_trip ON vehicle_location_history(trip_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_vehicle_location_history_vehicle ON vehicle_location_history(vehicle_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_vehicle_location_history_driver ON vehicle_location_history(driver_id, recorded_at DESC);

-- ----------------------------------------------------------------------------
-- 4. Enable Supabase Realtime Replication on Live Locations
-- ----------------------------------------------------------------------------
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'vehicle_current_locations'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE vehicle_current_locations;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Publication supabase_realtime not found or already contains vehicle_current_locations';
END $$;

-- ----------------------------------------------------------------------------
-- 5. Helper Function: Auto-cleanup of historical GPS records older than 30 days
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION purge_old_vehicle_location_history(days_to_keep INTEGER DEFAULT 30)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM vehicle_location_history
    WHERE recorded_at < (NOW() - (days_to_keep || ' days')::INTERVAL);
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- ----------------------------------------------------------------------------
-- 6. Row Level Security (RLS) Policies
-- ----------------------------------------------------------------------------
ALTER TABLE vehicle_current_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_location_history ENABLE ROW LEVEL SECURITY;

-- Allow public / authenticated reads on current locations
CREATE POLICY "Allow authenticated read on vehicle_current_locations"
    ON vehicle_current_locations FOR SELECT
    TO authenticated
    USING (true);

-- Allow backend service role to insert / update / delete
CREATE POLICY "Allow service_role full access on vehicle_current_locations"
    ON vehicle_current_locations FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow authenticated read on vehicle_location_history"
    ON vehicle_location_history FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Allow service_role full access on vehicle_location_history"
    ON vehicle_location_history FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);
