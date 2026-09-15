"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = void 0;
const supabaseClient_1 = require("./supabaseClient");
const logger_1 = require("../utils/logger");
/**
 * Database Management and Supabase Synchronization service
 */
class DatabaseStore {
    qrScanLogs = [];
    vehicleLocations = [];
    auditLogs = [];
    /**
     * Test database connectivity and verify table accessibility
     */
    async syncWithSupabase() {
        const supabase = (0, supabaseClient_1.getSupabaseClient)();
        if (!supabase) {
            logger_1.logger.warn('⚠️ Supabase client not configured. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env');
            return;
        }
        try {
            logger_1.logger.info('🔄 Verifying Supabase live database connection...');
            const { data: colleges, error } = await supabase.from('colleges').select('id, name');
            if (error) {
                logger_1.logger.warn(`⚠️ Supabase connection warning: ${error.message}`);
            }
            else {
                logger_1.logger.info(`✅ Supabase database online. ${colleges?.length || 0} colleges registered.`);
            }
        }
        catch (err) {
            logger_1.logger.error(`❌ Supabase database connection failed: ${err.message}`);
        }
    }
}
exports.db = new DatabaseStore();
//# sourceMappingURL=db.js.map