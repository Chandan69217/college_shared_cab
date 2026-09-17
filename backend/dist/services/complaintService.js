"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ComplaintService = void 0;
const crypto_1 = require("../utils/crypto");
const notificationService_1 = require("./notificationService");
const complaintRepository_1 = require("../repositories/complaintRepository");
class ComplaintService {
    /**
     * Create a support ticket / complaint in Supabase
     */
    static async createComplaint(studentId, data) {
        const ticketNumber = (0, crypto_1.generateTicketNumber)();
        const complaint = await complaintRepository_1.ComplaintRepository.create({
            ticket_number: ticketNumber,
            student_id: studentId,
            category: data.category,
            subject: data.subject,
            description: data.description,
            priority: data.priority || 'MEDIUM',
            status: 'OPEN',
        });
        try {
            await notificationService_1.NotificationService.createNotification({
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
        }
        catch (notifErr) {
            // Non-blocking notification error
        }
        return complaint;
    }
    /**
     * Admin response and resolution in Supabase
     */
    static async replyComplaint(complaintId, adminId, response, status = 'RESOLVED') {
        const complaint = await complaintRepository_1.ComplaintRepository.updateStatus(complaintId, status, response, adminId);
        try {
            await notificationService_1.NotificationService.createNotification({
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
        }
        catch (notifErr) {
            // Non-blocking notification error
        }
        return complaint;
    }
}
exports.ComplaintService = ComplaintService;
//# sourceMappingURL=complaintService.js.map