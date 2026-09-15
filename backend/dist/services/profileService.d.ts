import { StudentProfile, DriverProfile, AdminProfile } from '../types';
export declare class ProfileService {
    /**
     * Get full user profile with role-specific profile and college association
     */
    static getProfile(userId: string): Promise<{
        user: {
            id: string;
            email: string;
            phone: string;
            full_name: string;
            role: "STUDENT" | "DRIVER" | "ADMIN";
            status: "PENDING" | "ACTIVE" | "SUSPENDED" | "DEACTIVATED";
            avatar_url: string | null | undefined;
            created_at: string;
        };
        profile: StudentProfile | DriverProfile | AdminProfile | null;
    }>;
    /**
     * Update editable profile fields while blocking system/protected properties
     */
    static updateProfile(userId: string, updates: {
        full_name?: string;
        phone?: string;
        email?: string;
        profile_photo_url?: string;
        address?: string;
        course?: string;
        semester?: number;
        student_id_number?: string;
        roll_number?: string;
        license_number?: string;
        department?: string;
    }): Promise<{
        user: {
            id: string;
            email: string;
            phone: string;
            full_name: string;
            role: "STUDENT" | "DRIVER" | "ADMIN";
            status: "PENDING" | "ACTIVE" | "SUSPENDED" | "DEACTIVATED";
            avatar_url: string | null | undefined;
            created_at: string;
        };
        profile: StudentProfile | DriverProfile | AdminProfile | null;
    }>;
    /**
     * Secure user account deletion with active relationship checks
     */
    static deleteProfile(userId: string): Promise<{
        success: boolean;
        message: string;
    }>;
}
