const path = require('path');
const dotenv = require(path.join(__dirname, '../backend/node_modules/dotenv'));
const { Client } = require(path.join(__dirname, '../backend/node_modules/pg'));

dotenv.config({ path: path.join(__dirname, '../backend/.env') });

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function runAlter() {
  await client.connect();
  console.log('Connected to PostgreSQL.');

  await client.query(`
    ALTER TABLE public.daily_travel_passes 
    ALTER COLUMN auth_token_hash TYPE TEXT;
  `);

  console.log('✅ Altered daily_travel_passes.auth_token_hash to TEXT successfully.');
  await client.end();
}

runAlter();
