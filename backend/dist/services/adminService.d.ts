import { VerificationStatus } from '../types';
export declare class AdminService {
    /**
     * Get Admin Dashboard Overview dynamic metrics
     */
    static getDashboardStats(): Promise<{
        totalStudents: number;
        activeSubscriptions: number;
        todaysTrips: number;
        activeVehicles: number;
        activeDrivers: number;
        todayRevenue: number;
        totalRevenue: number;
        averageOccupancy: number;
        pendingVerifications: number;
    }>;
    /**
     * Review and update student verification status
     */
    static updateStudentVerification(studentId: string, status: VerificationStatus, adminId: string, notes?: string): Promise<import("../types").StudentProfile>;
    /**
     * Create a new driver account
     */
    static createDriver(data: {
        college_id: string;
        email: string;
        phone: string;
        full_name: string;
        password: string;
        license_number: string;
        license_expiry: string;
        aadhar_number?: string;
        experience_years: number;
    }): Promise<{
        user: {
            id: string;
            email: string;
            phone: string;
            full_name: string;
            password_hash: string;
            role: "DRIVER";
            status: "ACTIVE";
            created_at: string;
            updated_at: string;
        };
        profile: {
            id: string;
            college_id: string;
            license_number: string;
            license_expiry: string;
            aadhar_number: string | undefined;
            experience_years: number;
            status: "ACTIVE";
            rating_avg: number;
            total_trips: number;
            created_at: string;
            updated_at: string;
        };
    }>;
}
