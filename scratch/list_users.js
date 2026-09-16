const path = require('path');
const backendDir = 'e:/Programs/Flutter Projects/college_shared_cab/backend';
const { createClient } = require(path.join(backendDir, 'node_modules/@supabase/supabase-js'));
const dotenv = require(path.join(backendDir, 'node_modules/dotenv'));
dotenv.config({ path: path.join(backendDir, '.env') });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
);

async function listUsers() {
  const { data: users, error } = await supabase.from('users').select('id, full_name, email, phone, role, status').limit(20);
  if (error) {
    console.error('Error fetching users:', error);
    return;
  }
  console.log('Registered Users:');
  console.table(users);
}

listUsers();
