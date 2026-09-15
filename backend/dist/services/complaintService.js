"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ComplaintService = void 0;
const crypto_1 = require("../utils/crypto");
const notificationProvider_1 = require("../integrations/notificationProvider");
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
        await notificationProvider_1.NotificationProvider.send(studentId, 'Support Ticket Created', `Ticket #${ticketNumber} has been logged under ${data.category}. We will respond within 24 hours.`, 'GENERAL', { ticketNumber, complaintId: complaint.id });
        return complaint;
    }
    /**
     * Admin response and resolution in Supabase
     */
    static async replyComplaint(complaintId, adminId, response, status = 'RESOLVED') {
        const complaint = await complaintRepository_1.ComplaintRepository.updateStatus(complaintId, status, response, adminId);
        await notificationProvider_1.NotificationProvider.send(complaint.student_id, `Support Ticket #${complaint.ticket_number} Updated`, `Admin Response: ${response}`, 'GENERAL', { complaintId });
        return complaint;
    }
}
exports.ComplaintService = ComplaintService;
//# sourceMappingURL=complaintService.js.map