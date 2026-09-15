import { Complaint, ComplaintCategory, ComplaintPriority, ComplaintStatus } from '../types';
export declare class ComplaintService {
    /**
     * Create a support ticket / complaint in Supabase
     */
    static createComplaint(studentId: string, data: {
        category: ComplaintCategory;
        subject: string;
        description: string;
        priority?: ComplaintPriority;
    }): Promise<Complaint>;
    /**
     * Admin response and resolution in Supabase
     */
    static replyComplaint(complaintId: string, adminId: string, response: string, status?: ComplaintStatus): Promise<Complaint>;
}
