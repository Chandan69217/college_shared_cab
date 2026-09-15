import { Complaint, ComplaintStatus } from '../types';
export declare class ComplaintRepository {
    private static getClient;
    static findAll(): Promise<Complaint[]>;
    static findByStudentId(studentId: string): Promise<Complaint[]>;
    static create(complaint: Partial<Complaint>): Promise<Complaint>;
    static updateStatus(id: string, status: ComplaintStatus, resolutionNotes?: string, resolvedBy?: string): Promise<Complaint>;
}
