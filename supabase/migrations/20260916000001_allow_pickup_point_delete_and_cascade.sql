-- Migration: 20260916000001_allow_pickup_point_delete_and_cascade.sql
-- Description: Allow deleting pickup points by cascading removal from route stops (route_pickup_points) 
-- and setting NULL on historical bookings, passes, and trip passenger manifests.

-- 1. Ensure route_pickup_points cascades on pickup point deletion
ALTER TABLE route_pickup_points DROP CONSTRAINT IF EXISTS route_pickup_points_pickup_point_id_fkey;
ALTER TABLE route_pickup_points
  ADD CONSTRAINT route_pickup_points_pickup_point_id_fkey
  FOREIGN KEY (pickup_point_id)
  REFERENCES pickup_points(id)
  ON DELETE CASCADE
  ON UPDATE CASCADE;

-- 2. Make pickup_point_id NULLABLE in bookings with ON DELETE SET NULL
ALTER TABLE bookings ALTER COLUMN pickup_point_id DROP NOT NULL;
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_pickup_point_id_fkey;
ALTER TABLE bookings
  ADD CONSTRAINT bookings_pickup_point_id_fkey
  FOREIGN KEY (pickup_point_id)
  REFERENCES pickup_points(id)
  ON DELETE SET NULL
  ON UPDATE CASCADE;

-- 3. Make pickup_point_id NULLABLE in daily_travel_passes with ON DELETE SET NULL
ALTER TABLE daily_travel_passes ALTER COLUMN pickup_point_id DROP NOT NULL;
ALTER TABLE daily_travel_passes DROP CONSTRAINT IF EXISTS daily_travel_passes_pickup_point_id_fkey;
ALTER TABLE daily_travel_passes
  ADD CONSTRAINT daily_travel_passes_pickup_point_id_fkey
  FOREIGN KEY (pickup_point_id)
  REFERENCES pickup_points(id)
  ON DELETE SET NULL
  ON UPDATE CASCADE;

-- 4. Make pickup_point_id NULLABLE in trip_passengers with ON DELETE SET NULL
ALTER TABLE trip_passengers ALTER COLUMN pickup_point_id DROP NOT NULL;
ALTER TABLE trip_passengers DROP CONSTRAINT IF EXISTS trip_passengers_pickup_point_id_fkey;
ALTER TABLE trip_passengers
  ADD CONSTRAINT trip_passengers_pickup_point_id_fkey
  FOREIGN KEY (pickup_point_id)
  REFERENCES pickup_points(id)
  ON DELETE SET NULL
  ON UPDATE CASCADE;
