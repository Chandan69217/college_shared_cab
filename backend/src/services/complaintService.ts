import { Complaint, ComplaintCategory, ComplaintPriority, ComplaintStatus } from '../types';
import { generateTicketNumber } from '../utils/crypto';
import { NotificationProvider } from '../integrations/notificationProvider';
import { ComplaintRepository } from '../repositories/complaintRepository';

export class ComplaintService {
  /**
   * Create a support ticket / complaint in Supabase
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
    const ticketNumber = generateTicketNumber();

    const complaint = await ComplaintRepository.create({
      ticket_number: ticketNumber,
      student_id: studentId,
      category: data.category,
      subject: data.subject,
      description: data.description,
      priority: data.priority || 'MEDIUM',
      status: 'OPEN',
    });

    await NotificationProvider.send(
      studentId,
      'Support Ticket Created',
      `Ticket #${ticketNumber} has been logged under ${data.category}. We will respond within 24 hours.`,
      'GENERAL',
      { ticketNumber, complaintId: complaint.id }
    );

    return complaint;
  }

  /**
   * Admin response and resolution in Supabase
   */
  public static async replyComplaint(
    complaintId: string,
    adminId: string,
    response: string,
    status: ComplaintStatus = 'RESOLVED'
  ): Promise<Complaint> {
    const complaint = await ComplaintRepository.updateStatus(complaintId, status, response, adminId);

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
