import { db } from '../database/db';
import { Complaint, ComplaintCategory, ComplaintPriority, ComplaintStatus } from '../types';
import { generateTicketNumber } from '../utils/crypto';
import { NotificationProvider } from '../integrations/notificationProvider';

export class ComplaintService {
  /**
   * Create a support ticket / complaint
   */
  public static async createComplaint(
    studentId: string,
    data: {
      category: ComplaintCategory;
      subject: string;
      description: string;
      priority?: ComplaintPriority;
    }
  ): Promise<Complaint> {
    const student = db.users.get(studentId);
    const now = new Date().toISOString();
    const id = `cmp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const ticketNumber = generateTicketNumber();

    const complaint: Complaint = {
      id,
      ticket_number: ticketNumber,
      student_id: studentId,
      student,
      category: data.category,
      subject: data.subject,
      description: data.description,
      priority: data.priority || 'MEDIUM',
      status: 'OPEN',
      created_at: now,
      updated_at: now,
    };

    db.complaints.set(id, complaint);

    await NotificationProvider.send(
      studentId,
      'Support Ticket Created',
      `Ticket #${ticketNumber} has been logged under ${data.category}. We will respond within 24 hours.`,
      'GENERAL',
      { ticketNumber, complaintId: id }
    );

    return complaint;
  }

  /**
   * Admin response and resolution
   */
  public static async replyComplaint(
    complaintId: string,
    adminId: string,
    response: string,
    status: ComplaintStatus = 'RESOLVED'
  ): Promise<Complaint> {
    const complaint = db.complaints.get(complaintId);
    if (!complaint) {
      const err: any = new Error('Complaint not found.');
      err.statusCode = 404;
      err.code = 'COMPLAINT_NOT_FOUND';
      throw err;
    }

    const now = new Date().toISOString();
    complaint.admin_response = response;
    complaint.status = status;
    complaint.resolved_by = adminId;
    if (status === 'RESOLVED' || status === 'CLOSED') {
      complaint.resolved_at = now;
    }
    complaint.updated_at = now;
    db.complaints.set(complaintId, complaint);

    await NotificationProvider.send(
      complaint.student_id,
      `Support Ticket #${complaint.ticket_number} Updated`,
      `Admin Response: ${response}`,
      'GENERAL',
      { complaintId }
    );

    return complaint;
  }
}
