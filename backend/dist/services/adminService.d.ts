import { VerificationStatus, UserStatus, DriverStatus, VehicleStatus } from '../types';
export declare class AdminService {
    /**
     * Get Admin Dashboard Overview dynamic metrics directly from Supabase
     */
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
    /**
     * Review and update student verification status in Supabase
     */
    static updateStudentVerification(studentId: string, status: VerificationStatus, adminId: string, notes?: string): Promise<import("../types").StudentProfile>;
    /**
     * Create a new student commuter account (User + Student Profile)
     */
    static createStudent(data: {
        college_id?: string;
        college_code?: string;
        email: string;
        phone: string;
        full_name: string;
        password?: string;
        student_id_number: string;
        roll_number?: string;
        course: string;
        semester: number;
        verification_status?: VerificationStatus;
    }): Promise<{
        user: import("../types").User;
        profile: import("../types").StudentProfile;
    }>;
    /**
     * Update student user and profile information
     */
    static updateStudent(studentId: string, data: {
        college_id?: string;
        full_name?: string;
        phone?: string;
        course?: string;
        semester?: number;
        student_id_number?: string;
        roll_number?: string;
        status?: UserStatus;
        verification_status?: VerificationStatus;
        verification_notes?: string;
    }): Promise<import("../types").StudentProfile | null>;
    /**
     * Delete student safely
     */
    static deleteStudent(studentId: string): Promise<void>;
    /**
     * Bulk update student statuses
     */
    static bulkUpdateStudents(studentIds: string[], action?: 'VERIFY' | 'REJECT' | 'SUSPEND' | 'ACTIVATE' | string, notes?: string, updates?: {
        verification_status?: VerificationStatus;
        user_status?: UserStatus;
    }): Promise<{
        processedCount: number;
        studentIds: string[];
    }>;
    /**
     * Create a new driver account in Supabase
     */
    static createDriver(data: {
        college_id?: string;
        email: string;
        phone: string;
        full_name: string;
        password: string;
        license_number: string;
        license_expiry: string;
        aadhar_number?: string;
        experience_years: number;
        status?: DriverStatus;
    }): Promise<{
        user: import("../types").User;
        profile: import("../types").DriverProfile;
    }>;
    /**
     * Update driver user and profile information
     */
    static updateDriver(driverId: string, data: {
        college_id?: string;
        full_name?: string;
        phone?: string;
        license_number?: string;
        license_expiry?: string;
        experience_years?: number;
        aadhar_number?: string;
        status?: DriverStatus;
    }): Promise<import("../types").DriverProfile | null>;
    /**
     * Delete driver safely
     */
    static deleteDriver(driverId: string): Promise<void>;
    /**
     * Update vehicle in Supabase
     */
    static updateVehicle(vehicleId: string, updates: {
        vehicle_number?: string;
        model?: string;
        type?: any;
        seating_capacity?: number;
        registration_number?: string;
        insurance_validity?: string;
        fitness_validity?: string;
        status?: VehicleStatus;
    }): Promise<import("../types").Vehicle>;
    /**
     * Delete vehicle safely
     */
    static deleteVehicle(vehicleId: string): Promise<void>;
    /**
     * Update route and stop sequence in Supabase
     */
    static updateRoute(routeId: string, updates: {
        name?: string;
        code?: string;
        description?: string;
        morning_departure_time?: string;
        evening_departure_time?: string;
        estimated_duration_mins?: number;
        default_vehicle_id?: string | null;
        default_driver_id?: string | null;
        max_capacity?: number;
        is_active?: boolean;
    }, stops?: any[]): Promise<import("../types").Route>;
    /**
     * Delete route safely
     */
    static deleteRoute(routeId: string): Promise<void>;
    /**
     * Centralized Assignment Matrix Overview
     */
    static getAssignmentsSummary(): Promise<{
        routes: {
            routeId: any;
            routeName: any;
            routeCode: any;
            morningDeparture: any;
            eveningDeparture: any;
            assignedVehicle: {
                id: string;
                vehicleNumber: string;
                model: string;
                type: "CAB_4" | "CAB_6" | "SHUTTLE_12" | "BUS_24";
                seatingCapacity: number;
                status: "ACTIVE" | "INACTIVE" | "MAINTENANCE";
            } | null;
            assignedDriver: {
                id: any;
                fullName: any;
                phone: any;
                licenseNumber: any;
                status: any;
            } | null;
            capacity: any;
            activeBookingsCount: number;
            isCapacityReached: boolean;
            status: string;
        }[];
        availableVehicles: import("../types").Vehicle[];
        availableDrivers: any[];
    }>;
    /**
     * Allocate Route Driver & Vehicle with validation
     */
    static allocateRouteResources(routeId: string, data: {
        default_vehicle_id?: string | null;
        default_driver_id?: string | null;
    }): Promise<import("../types").Route>;
    /**
     * Create a new admin account (User + Admin Profile) in Supabase
     */
    static createAdmin(data: {
        email: string;
        phone: string;
        full_name: string;
        password: string;
        department?: string;
        permissions?: string[];
    }): Promise<{
        user: import("../types").User;
        profile: import("../types").AdminProfile;
    }>;
    /**
     * Create or update an admin profile for an existing user
     */
    static createOrUpdateAdminProfile(userId: string, data: {
        full_name?: string;
        department?: string;
        permissions?: string[];
    }): Promise<import("../types").AdminProfile>;
}
