"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationProvider = void 0;
const db_1 = require("../database/db");
const logger_1 = require("../utils/logger");
class NotificationProvider {
    /**
     * Sends in-app and simulated push notification
     */
    static async send(userId, title, message, type, data = {}) {
        const notifId = `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
        const notification = {
            id: notifId,
            user_id: userId,
            title,
            message,
            type,
            is_read: false,
            data,
            created_at: new Date().toISOString(),
        };
        db_1.db.notifications.set(notifId, notification);
        logger_1.logger.info(`Notification sent to User ${userId}: "${title}" [${type}]`);
    }
    /**
     * Broadcasts to all users of a specific role
     */
    static async broadcastToRole(role, title, message, type = 'GENERAL') {
        let count = 0;
        for (const [userId, user] of db_1.db.users.entries()) {
            if (role === 'ALL' || user.role === role) {
                await this.send(userId, title, message, type);
                count++;
            }
        }
        return count;
    }
}
exports.NotificationProvider = NotificationProvider;
//# sourceMappingURL=notificationProvider.js.map