const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function checkConstraints() {
  await client.connect();
  const res = await client.query(`
    SELECT conname, pg_get_constraintdef(c.oid)
    FROM pg_constraint c
    JOIN pg_namespace n ON n.oid = c.connamespace
    WHERE conrelid = 'trips'::regclass;
  `);
  console.log('Constraints on trips:', res.rows);

  const trips = await client.query(`
    SELECT id, route_id, driver_id, vehicle_id, trip_date, trip_type, status, scheduled_departure_time
    FROM trips
    ORDER BY created_at DESC
    LIMIT 10;
  `);
  console.log('\nRecent trips:', trips.rows);
  await client.end();
}

checkConstraints().catch(console.error);
