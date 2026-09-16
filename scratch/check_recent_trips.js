const path = require('path');
const backendDir = 'e:/Programs/Flutter Projects/college_shared_cab/backend';
const { createClient } = require(path.join(backendDir, 'node_modules/@supabase/supabase-js'));
const dotenv = require(path.join(backendDir, 'node_modules/dotenv'));
dotenv.config({ path: path.join(backendDir, '.env') });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
);

async function checkTrips() {
  const { data: trips, error } = await supabase
    .from('trips')
    .select('id, trip_date, trip_type, status, scheduled_departure_time, driver_id, vehicle_id, live_latitude, live_longitude, last_gps_update')
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    console.error('Error fetching trips:', error);
    return;
  }

  console.log('Recent Trips in Database:');
  console.table(trips);
}

checkTrips();
