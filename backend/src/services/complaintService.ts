import { Complaint, ComplaintCategory, ComplaintPriority, ComplaintStatus } from '../types';
import { generateTicketNumber } from '../utils/crypto';
import { NotificationProvider } from '../integrations/notificationProvider';
import { NotificationService } from './notificationService';
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

    try {
      await NotificationService.createNotification({
        userId: studentId,
        recipientRole: 'STUDENT',
        title: 'Support Ticket Created',
        message: `Ticket #${ticketNumber} has been logged under ${data.category}. We will respond within 24 hours.`,
        type: 'COMPLAINT_CREATED',
        entityType: 'COMPLAINT',
        entityId: complaint.id,
        priority: 'NORMAL',
        data: { ticketNumber, complaintId: complaint.id },
      });
    } catch (notifErr) {
      // Non-blocking notification error
    }

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

    try {
      await NotificationService.createNotification({
        userId: complaint.student_id,
        recipientRole: 'STUDENT',
        title: `Support Ticket #${complaint.ticket_number} Updated`,
        message: `Status: ${status}. Admin response: ${response}`,
        type: status === 'RESOLVED' ? 'COMPLAINT_RESOLVED' : 'SYSTEM_ANNOUNCEMENT',
        entityType: 'COMPLAINT',
        entityId: complaintId,
        priority: 'NORMAL',
        data: { complaintId, ticketNumber: complaint.ticket_number, status },
      });
    } catch (notifErr) {
      // Non-blocking notification error
    }

    return complaint;
  }
}
