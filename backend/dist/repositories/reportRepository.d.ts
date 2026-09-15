export declare class ReportRepository {
    private static getClient;
    static getDashboardStats(): Promise<{
        totalStudents: number;
        activeStudents: number;
        verifiedStudents: number;
        pendingVerifications: number;
        activeSubscriptions: number;
        todaysTrips: number;
        activeTrips: number;
        totalVehicles: number;
        activeVehicles: number;
        maintenanceVehicles: number;
        totalDrivers: number;
        activeDrivers: number;
        onLeaveDrivers: number;
        totalRoutes: number;
        activeRoutes: number;
        assignedVehiclesCount: number;
        assignedDriversCount: number;
        todayRevenue: number;
        totalRevenue: number;
        averageOccupancy: number;
        planDistribution: {
            name: string;
            value: number;
            color: string;
        }[];
        weeklyData: any[];
    }>;
    static getReportsData(): Promise<{
        revenueByPlan: Record<string, {
            count: number;
            total: number;
        }>;
        driverPerformance: any[];
        vehicleUtilization: any[];
    }>;
}
