"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.supabase = void 0;
exports.getSupabaseClient = getSupabaseClient;
exports.getPgPool = getPgPool;
exports.testDatabaseConnection = testDatabaseConnection;
exports.isDatabaseConnected = isDatabaseConnected;
const supabase_js_1 = require("@supabase/supabase-js");
const pg_1 = require("pg");
const env_1 = require("../config/env");
const logger_1 = require("../utils/logger");
let supabaseInstance = null;
let pgPoolInstance = null;
let isConnected = false;
function getSupabaseClient() {
    if (supabaseInstance)
        return supabaseInstance;
    const url = env_1.ENV.SUPABASE_URL;
    const key = env_1.ENV.SUPABASE_SERVICE_ROLE_KEY || env_1.ENV.SUPABASE_ANON_KEY;
    if (url && key && !url.includes('mock-supabase.collegecab.local') && !key.includes('dummy_')) {
        try {
            supabaseInstance = (0, supabase_js_1.createClient)(url, key, {
                auth: {
                    persistSession: false,
                    autoRefreshToken: false,
                },
            });
            logger_1.logger.info('🔗 Supabase client initialized successfully.');
        }
        catch (err) {
            logger_1.logger.warn(`⚠️ Could not initialize Supabase client: ${err.message}`);
        }
    }
    return supabaseInstance;
}
function getPgPool() {
    if (pgPoolInstance)
        return pgPoolInstance;
    if (env_1.ENV.DATABASE_URL && !env_1.ENV.DATABASE_URL.includes('localhost:5432/college_cab')) {
        try {
            pgPoolInstance = new pg_1.Pool({
                connectionString: env_1.ENV.DATABASE_URL,
                ssl: env_1.ENV.DATABASE_URL.includes('supabase.co') ? { rejectUnauthorized: false } : undefined,
                max: 10,
                idleTimeoutMillis: 30000,
                connectionTimeoutMillis: 10000,
            });
            logger_1.logger.info('🐘 PostgreSQL connection pool initialized.');
        }
        catch (err) {
            logger_1.logger.warn(`⚠️ Could not initialize PostgreSQL pool: ${err.message}`);
        }
    }
    return pgPoolInstance;
}
/**
 * Test connectivity with Supabase / PostgreSQL
 */
async function testDatabaseConnection() {
    const supabase = getSupabaseClient();
    if (supabase) {
        try {
            const { data, error } = await supabase.from('colleges').select('id, name').limit(1);
            if (!error) {
                isConnected = true;
                logger_1.logger.info(`✅ Successfully connected to Supabase project at ${env_1.ENV.SUPABASE_URL}`);
                return true;
            }
            else {
                logger_1.logger.warn(`⚠️ Supabase ping returned error: ${error.message} (Code: ${error.code})`);
            }
        }
        catch (err) {
            logger_1.logger.warn(`⚠️ Supabase connection failed: ${err.message}`);
        }
    }
    const pool = getPgPool();
    if (pool) {
        try {
            const client = await pool.connect();
            await client.query('SELECT NOW()');
            client.release();
            isConnected = true;
            logger_1.logger.info('✅ Successfully connected to PostgreSQL database directly.');
            return true;
        }
        catch (err) {
            logger_1.logger.warn(`⚠️ PostgreSQL connection error: ${err.message}`);
        }
    }
    logger_1.logger.info('ℹ️ Using high-performance in-memory repository store.');
    return false;
}
function isDatabaseConnected() {
    return isConnected;
}
exports.supabase = getSupabaseClient();
//# sourceMappingURL=supabaseClient.js.map