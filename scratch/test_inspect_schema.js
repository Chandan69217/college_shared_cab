const path = require('path');
const { createClient } = require(path.join(__dirname, '../backend/node_modules/@supabase/supabase-js'));
const dotenv = require(path.join(__dirname, '../backend/node_modules/dotenv'));

dotenv.config({ path: path.join(__dirname, '../backend/.env') });
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY);

async function inspectSchema() {
  const { data: stuProfile } = await supabase.from('student_profiles').select('*').limit(1);
  console.log('student_profiles sample:', stuProfile);

  const { data: users } = await supabase.from('users').select('*').limit(1);
  console.log('users sample:', users);

  const { data: bookings } = await supabase.from('bookings').select('*').limit(1);
  console.log('bookings sample:', bookings);

  const { data: subs } = await supabase.from('subscriptions').select('*').limit(1);
  console.log('subscriptions sample:', subs);
}

inspectSchema();
