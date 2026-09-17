"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationProvider = void 0;
const notificationService_1 = require("../services/notificationService");
class NotificationProvider {
    /**
     * Sends in-app and push notification via centralized NotificationService
     */
    static async send(userId, title, message, type, data = {}, options = {}) {
        await notificationService_1.NotificationService.createNotification({
            userId,
            title,
            message,
            type,
            recipientRole: options.recipientRole,
            entityType: options.entityType,
            entityId: options.entityId,
            priority: options.priority || 'NORMAL',
            data,
        });
    }
    /**
     * Broadcasts to all users of a specific role
     */
    static async broadcastToRole(role, title, message, type = 'GENERAL') {
        const scope = role === 'STUDENT' ? 'STUDENTS' : role === 'DRIVER' ? 'DRIVERS' : 'ALL';
        const result = await notificationService_1.NotificationService.broadcastAnnouncement({
            title,
            message,
            type,
            scope,
        });
        return result.recipientCount;
    }
}
exports.NotificationProvider = NotificationProvider;
//# sourceMappingURL=notificationProvider.js.map