const path = require('path');
const { createClient } = require(path.join(__dirname, '../backend/node_modules/@supabase/supabase-js'));
const dotenv = require(path.join(__dirname, '../backend/node_modules/dotenv'));

dotenv.config({ path: path.join(__dirname, '../backend/.env') });
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY);

async function testTripUpdate() {
  const { data: trip } = await supabase.from('trips').select('*').limit(1).single();
  console.log('Before update trip:', trip);

  const { data: updated, error } = await supabase
    .from('trips')
    .update({
      status: 'SCHEDULED',
      actual_start_time: null,
      actual_end_time: null,
      booked_seats: 0,
    })
    .eq('id', trip.id)
    .select('*')
    .single();

  if (error) {
    console.error('Update trip error:', error);
  } else {
    console.log('After update trip:', updated);
  }
}

testTripUpdate();
