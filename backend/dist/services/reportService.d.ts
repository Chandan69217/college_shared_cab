export declare class ReportService {
    /**
     * Generates dynamic financial and operational reports directly from Supabase
     */
    static getReportsData(): Promise<{
        revenueByPlan: Record<string, {
            count: number;
            total: number;
        }>;
        driverPerformance: any[];
        vehicleUtilization: any[];
    }>;
}
