const path = require('path');
const dotenv = require(path.join(__dirname, '../backend/node_modules/dotenv'));
const { Client } = require(path.join(__dirname, '../backend/node_modules/pg'));

dotenv.config({ path: path.join(__dirname, '../backend/.env') });

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function inspectColumns() {
  await client.connect();

  const tpRes = await client.query(`
    SELECT column_name, data_type, character_maximum_length 
    FROM information_schema.columns 
    WHERE table_name = 'trip_passengers'
  `);
  console.log('trip_passengers columns:', tpRes.rows);

  const dpRes = await client.query(`
    SELECT column_name, data_type, character_maximum_length 
    FROM information_schema.columns 
    WHERE table_name = 'daily_travel_passes'
  `);
  console.log('daily_travel_passes columns:', dpRes.rows);

  await client.end();
}

inspectColumns();
