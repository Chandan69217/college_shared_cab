import { User, UserRole } from '../types';
export declare class AuthService {
    /**
     * Register a new student in Supabase
     */
    static registerStudent(data: {
        email: string;
        phone: string;
        full_name: string;
        password: string;
        college_id?: string;
        college_code?: string;
        student_id_number: string;
        roll_number?: string;
        course: string;
        semester: number;
        id_card_url?: string;
    }): Promise<{
        user: User;
        token: string;
    }>;
    /**
     * Register a new admin in Supabase
     */
    static registerAdmin(data: {
        email: string;
        phone: string;
        full_name: string;
        password: string;
        department?: string;
        permissions?: string[];
    }): Promise<{
        user: User;
        profile: any;
        token: string;
    }>;
    /**
     * Login with email or phone and password against Supabase users table
     */
    static login(emailOrPhone: string, plainPassword: string, expectedRole?: UserRole): Promise<{
        user: User;
        profile: any;
        token: string;
    }>;
    /**
     * Request OTP for student mobile login
     */
    static requestOtp(phone: string): Promise<{
        message: string;
    }>;
    /**
     * Verify OTP and log in student
     */
    static verifyOtp(phone: string, otp: string): Promise<{
        user: User;
        profile: any;
        token: string;
    }>;
    /**
     * Get current authenticated user details
     */
    static getCurrentUser(userId: string): Promise<{
        user: User;
        profile: any;
    }>;
    /**
     * Change password for logged-in user with strict validation
     */
    static changePassword(userId: string, currentPass: string, newPass: string): Promise<{
        message: string;
    }>;
    /**
     * Initiate forgot password flow with role isolation and clear feedback
     * Dispatches OTP to BOTH email and SMS simultaneously for valid accounts
     */
    static forgotPassword(identifierOrEmail?: string, phone?: string, expectedRole?: 'STUDENT' | 'DRIVER' | 'ADMIN'): Promise<{
        message: string;
        cooldownSeconds: number;
    }>;
    /**
     * Verify recovery OTP and issue single-use resetToken with role scoping
     */
    static verifyRecoveryOtp(identifier: string, otp: string, purpose?: string, expectedRole?: 'STUDENT' | 'DRIVER' | 'ADMIN'): Promise<{
        resetToken: string;
        message: string;
    }>;
    /**
     * Reset user password using verified single-use resetToken and enforce role boundaries
     */
    static resetPassword(identifier: string, resetToken: string, newPass: string, expectedRole?: 'STUDENT' | 'DRIVER' | 'ADMIN'): Promise<{
        message: string;
    }>;
    private static generateToken;
}
