const path = require('path');
const { createClient } = require(path.join(__dirname, '../backend/node_modules/@supabase/supabase-js'));
const dotenv = require(path.join(__dirname, '../backend/node_modules/dotenv'));

dotenv.config({ path: path.join(__dirname, '../backend/.env') });
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY);

async function testRelations() {
  console.log('Testing booking select...');
  const { data: bData, error: bErr } = await supabase
    .from('bookings')
    .select('*, trip:trips(*, vehicle:vehicles(*), driver:users!trips_driver_id_fkey(*)), route:routes(*), pickup_point:pickup_points(*), student:users!bookings_student_id_fkey(*)')
    .limit(2);

  if (bErr) {
    console.error('Booking query error:', bErr.message);
  } else {
    console.log('Booking query SUCCESS! Count:', bData.length);
    console.log('Sample Booking Student:', bData[0]?.student);
  }

  console.log('\nTesting subscriptions select...');
  const { data: sData, error: sErr } = await supabase
    .from('subscriptions')
    .select('*, plan:subscription_plans(*), student:users!subscriptions_student_id_fkey(*)')
    .limit(2);

  if (sErr) {
    console.error('Subscription query error:', sErr.message);
  } else {
    console.log('Subscription query SUCCESS! Count:', sData.length);
    console.log('Sample Subscription Student:', sData[0]?.student);
  }
}

testRelations();
