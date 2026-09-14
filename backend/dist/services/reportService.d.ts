export declare class ReportService {
    /**
     * Generates dynamic financial and operational reports
     */
    static getReportsData(): Promise<{
        revenueByPlan: Record<string, {
            count: number;
            total: number;
        }>;
        dailyRidesTrend: {
            day: string;
            completedRides: number;
            cancelledRides: number;
            occupancyPercent: number;
        }[];
        driverPerformance: any[];
        vehicleUtilization: any[];
    }>;
}
