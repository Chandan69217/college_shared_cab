/**
 * Database Management and Supabase Synchronization service
 */
declare class DatabaseStore {
    qrScanLogs: Array<any>;
    vehicleLocations: Array<any>;
    auditLogs: Array<any>;
    /**
     * Test database connectivity and verify table accessibility
     */
    syncWithSupabase(): Promise<void>;
}
export declare const db: DatabaseStore;
export {};
