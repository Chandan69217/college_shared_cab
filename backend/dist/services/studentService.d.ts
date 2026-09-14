import { StudentProfile } from '../types';
export declare class StudentService {
    /**
     * Submit or update student verification documents
     */
    static submitVerification(studentId: string, data: {
        student_id_number: string;
        roll_number?: string;
        course: string;
        semester: number;
        id_card_url: string;
    }): Promise<StudentProfile>;
    /**
     * Get student dashboard overview
     */
    static getStudentDashboard(studentId: string): Promise<{
        user: {
            id: string | undefined;
            full_name: string | undefined;
            email: string | undefined;
            phone: string | undefined;
            role: "STUDENT" | "DRIVER" | "ADMIN" | undefined;
        };
        profile: StudentProfile | undefined;
        activeSubscription: any;
        todaysBooking: any;
        todaysPass: any;
        unreadNotificationsCount: number;
    }>;
    /**
     * Trigger SOS Emergency alert
     */
    static triggerSosAlert(studentId: string, location?: {
        latitude: number;
        longitude: number;
    }): Promise<{
        success: boolean;
        timestamp: string;
        studentName: string | undefined;
        studentPhone: string | undefined;
        location: {
            latitude: number;
            longitude: number;
        } | undefined;
        contactsNotified: number;
    }>;
}
