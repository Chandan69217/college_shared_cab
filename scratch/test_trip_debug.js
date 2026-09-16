const path = require('path');
const { createClient } = require(path.join(__dirname, '../backend/node_modules/@supabase/supabase-js'));
const dotenv = require(path.join(__dirname, '../backend/node_modules/dotenv'));

dotenv.config({ path: path.join(__dirname, '../backend/.env') });
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY);

async function checkTrips() {
  const { data: trips } = await supabase.from('trips').select('*').limit(3);
  console.log('Trips in DB:', trips);
}

checkTrips();
