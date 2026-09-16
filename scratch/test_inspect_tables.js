const path = require('path');
const { createClient } = require(path.join(__dirname, '../backend/node_modules/@supabase/supabase-js'));
const dotenv = require(path.join(__dirname, '../backend/node_modules/dotenv'));

dotenv.config({ path: path.join(__dirname, '../backend/.env') });
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY);

async function inspect() {
  const { data: tp } = await supabase.from('trip_passengers').select('*').limit(1);
  console.log('trip_passengers sample:', tp);

  const { data: dp } = await supabase.from('daily_travel_passes').select('*').limit(1);
  console.log('daily_travel_passes sample:', dp);
}

inspect();
