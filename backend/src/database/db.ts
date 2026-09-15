import { getSupabaseClient } from './supabaseClient';
import { logger } from '../utils/logger';

/**
 * Database Management and Supabase Synchronization service
 */
class DatabaseStore {
  public qrScanLogs: Array<any> = [];
  public vehicleLocations: Array<any> = [];
  public auditLogs: Array<any> = [];

  /**
   * Test database connectivity and verify table accessibility
   */
  public async syncWithSupabase(): Promise<void> {
    const supabase = getSupabaseClient();
    if (!supabase) {
      logger.warn('⚠️ Supabase client not configured. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env');
      return;
    }

    try {
      logger.info('🔄 Verifying Supabase live database connection...');
      const { data: colleges, error } = await supabase.from('colleges').select('id, name');
      if (error) {
        logger.warn(`⚠️ Supabase connection warning: ${error.message}`);
      } else {
        logger.info(`✅ Supabase database online. ${colleges?.length || 0} colleges registered.`);
      }
    } catch (err: any) {
      logger.error(`❌ Supabase database connection failed: ${err.message}`);
    }
  }
}

export const db = new DatabaseStore();
