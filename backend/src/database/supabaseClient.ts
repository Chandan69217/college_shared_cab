import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Pool } from 'pg';
import { ENV } from '../config/env';
import { logger } from '../utils/logger';

let supabaseInstance: SupabaseClient | null = null;
let pgPoolInstance: Pool | null = null;
let isConnected = false;

export function getSupabaseClient(): SupabaseClient | null {
  if (supabaseInstance) return supabaseInstance;

  const url = ENV.SUPABASE_URL;
  const key = ENV.SUPABASE_SERVICE_ROLE_KEY || ENV.SUPABASE_ANON_KEY;

  if (url && key && !url.includes('mock-supabase.collegecab.local') && !key.includes('dummy_')) {
    try {
      supabaseInstance = createClient(url, key, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      });
      logger.info('🔗 Supabase client initialized successfully.');
    } catch (err: any) {
      logger.warn(`⚠️ Could not initialize Supabase client: ${err.message}`);
    }
  }

  return supabaseInstance;
}

export function getPgPool(): Pool | null {
  if (pgPoolInstance) return pgPoolInstance;

  if (ENV.DATABASE_URL && !ENV.DATABASE_URL.includes('localhost:5432/college_cab')) {
    try {
      pgPoolInstance = new Pool({
        connectionString: ENV.DATABASE_URL,
        ssl: ENV.DATABASE_URL.includes('supabase.co') ? { rejectUnauthorized: false } : undefined,
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
      });
      logger.info('🐘 PostgreSQL connection pool initialized.');
    } catch (err: any) {
      logger.warn(`⚠️ Could not initialize PostgreSQL pool: ${err.message}`);
    }
  }

  return pgPoolInstance;
}

/**
 * Test connectivity with Supabase / PostgreSQL
 */
export async function testDatabaseConnection(): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase.from('colleges').select('id, name').limit(1);
      if (!error) {
        isConnected = true;
        logger.info(`✅ Successfully connected to Supabase project at ${ENV.SUPABASE_URL}`);
        return true;
      } else {
        logger.warn(`⚠️ Supabase ping returned error: ${error.message} (Code: ${error.code})`);
      }
    } catch (err: any) {
      logger.warn(`⚠️ Supabase connection failed: ${err.message}`);
    }
  }

  const pool = getPgPool();
  if (pool) {
    try {
      const client = await pool.connect();
      await client.query('SELECT NOW()');
      client.release();
      isConnected = true;
      logger.info('✅ Successfully connected to PostgreSQL database directly.');
      return true;
    } catch (err: any) {
      logger.warn(`⚠️ PostgreSQL connection error: ${err.message}`);
    }
  }

  logger.info('ℹ️ Using high-performance in-memory repository store.');
  return false;
}

export function isDatabaseConnected(): boolean {
  return isConnected;
}

export const supabase = getSupabaseClient();
