import { User, UserRole } from '../types';
export declare class AuthService {
    /**
     * Register a new student
     */
    static registerStudent(data: {
        email: string;
        phone: string;
        full_name: string;
        password: string;
        college_id: string;
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
     * Login with email or phone and password
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
        demoOtp?: string;
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
    private static generateToken;
}
