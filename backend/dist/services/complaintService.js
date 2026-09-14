"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ComplaintService = void 0;
const db_1 = require("../database/db");
const crypto_1 = require("../utils/crypto");
const notificationProvider_1 = require("../integrations/notificationProvider");
class ComplaintService {
    /**
     * Create a support ticket / complaint
     */
    static async createComplaint(studentId, data) {
        const student = db_1.db.users.get(studentId);
        const now = new Date().toISOString();
        const id = `cmp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
        const ticketNumber = (0, crypto_1.generateTicketNumber)();
        const complaint = {
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
        db_1.db.complaints.set(id, complaint);
        await notificationProvider_1.NotificationProvider.send(studentId, 'Support Ticket Created', `Ticket #${ticketNumber} has been logged under ${data.category}. We will respond within 24 hours.`, 'GENERAL', { ticketNumber, complaintId: id });
        return complaint;
    }
    /**
     * Admin response and resolution
     */
    static async replyComplaint(complaintId, adminId, response, status = 'RESOLVED') {
        const complaint = db_1.db.complaints.get(complaintId);
        if (!complaint) {
            const err = new Error('Complaint not found.');
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
        db_1.db.complaints.set(complaintId, complaint);
        await notificationProvider_1.NotificationProvider.send(complaint.student_id, `Support Ticket #${complaint.ticket_number} Updated`, `Admin Response: ${response}`, 'GENERAL', { complaintId });
        return complaint;
    }
}
exports.ComplaintService = ComplaintService;
//# sourceMappingURL=complaintService.js.map