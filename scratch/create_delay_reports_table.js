const path = require('path');
const dotenv = require(path.join(__dirname, '../backend/node_modules/dotenv'));
const { Client } = require(path.join(__dirname, '../backend/node_modules/pg'));

dotenv.config({ path: path.join(__dirname, '../backend/.env') });

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function runMigration() {
  try {
    await client.connect();
    console.log('Connected to PostgreSQL database.');

    const sql = `
      CREATE TABLE IF NOT EXISTS public.delay_reports (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE ON UPDATE CASCADE,
        driver_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE ON UPDATE CASCADE,
        delay_minutes INTEGER NOT NULL DEFAULT 15,
        reason VARCHAR(100) NOT NULL DEFAULT 'TRAFFIC',
        current_stop_id UUID REFERENCES public.pickup_points(id) ON DELETE SET NULL ON UPDATE CASCADE,
        notes TEXT,
        reported_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_delay_reports_trip_id ON public.delay_reports(trip_id);
      CREATE INDEX IF NOT EXISTS idx_delay_reports_reported_at ON public.delay_reports(reported_at DESC);
    `;

    await client.query(sql);
    console.log('✅ Created delay_reports table and indexes successfully.');
  } catch (err) {
    console.error('Migration error:', err.message);
  } finally {
    await client.end();
  }
}

runMigration();
