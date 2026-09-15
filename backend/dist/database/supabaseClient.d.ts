import { SupabaseClient } from '@supabase/supabase-js';
import { Pool } from 'pg';
export declare function getSupabaseClient(): SupabaseClient | null;
export declare function getPgPool(): Pool | null;
/**
 * Test connectivity with Supabase / PostgreSQL
 */
export declare function testDatabaseConnection(): Promise<boolean>;
export declare function isDatabaseConnected(): boolean;
export declare const supabase: SupabaseClient<any, "public", "public", any, any> | null;
