"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationController = void 0;
const notificationService_1 = require("../services/notificationService");
const response_1 = require("../utils/response");
const zod_1 = require("zod");
const registerDeviceTokenSchema = zod_1.z.object({
    deviceToken: zod_1.z.string().min(1, 'deviceToken is required'),
    platform: zod_1.z.enum(['android', 'ios', 'web']).default('android'),
    deviceName: zod_1.z.string().optional(),
    appVersion: zod_1.z.string().optional(),
});
const broadcastAnnouncementSchema = zod_1.z.object({
    title: zod_1.z.string().min(1, 'Title is required'),
    message: zod_1.z.string().min(1, 'Message is required'),
    type: zod_1.z.string().default('SYSTEM_ANNOUNCEMENT'),
    scope: zod_1.z.enum(['ALL', 'STUDENTS', 'DRIVERS', 'COLLEGE', 'ROUTE', 'SPECIFIC_USER']),
    targetId: zod_1.z.string().uuid().optional(),
    priority: zod_1.z.enum(['LOW', 'NORMAL', 'HIGH', 'CRITICAL']).default('NORMAL'),
    data: zod_1.z.record(zod_1.z.any()).optional(),
});
class NotificationController {
    /**
     * GET /api/v1/notifications
     * List notifications for authenticated user (student, driver, admin)
     */
    static async getUserNotifications(req, res, next) {
        try {
            const userId = req.user.userId;
            const filter = req.query.filter || 'ALL';
            const page = parseInt(req.query.page || '1', 10);
            const limit = parseInt(req.query.limit || '30', 10);
            const result = await notificationService_1.NotificationService.getUserNotifications(userId, filter, page, limit);
            (0, response_1.sendSuccess)(res, 'Notifications retrieved.', result);
        }
        catch (err) {
            next(err);
        }
    }
    /**
     * GET /api/v1/notifications/unread-count
     * Return real-time unread notification count
     */
    static async getUnreadCount(req, res, next) {
        try {
            const userId = req.user.userId;
            const unreadCount = await notificationService_1.NotificationService.getUnreadCount(userId);
            (0, response_1.sendSuccess)(res, 'Unread notification count retrieved.', { unreadCount });
        }
        catch (err) {
            next(err);
        }
    }
    /**
     * POST /api/v1/notifications/:id/read
     * Mark a single notification as read
     */
    static async markAsRead(req, res, next) {
        try {
            const userId = req.user.userId;
            const userRole = req.user.role;
            const notificationId = req.params.id;
            const result = await notificationService_1.NotificationService.markAsRead(notificationId, userId, userRole);
            (0, response_1.sendSuccess)(res, 'Notification marked as read.', result);
        }
        catch (err) {
            next(err);
        }
    }
    /**
     * POST /api/v1/notifications/read-all
     * Mark all notifications as read for current user
     */
    static async markAllAsRead(req, res, next) {
        try {
            const userId = req.user.userId;
            const userRole = req.user.role;
            const result = await notificationService_1.NotificationService.markAllAsRead(userId, userRole);
            (0, response_1.sendSuccess)(res, 'All notifications marked as read.', result);
        }
        catch (err) {
            next(err);
        }
    }
    /**
     * POST /api/v1/notifications/device-token
     * Register push device token
     */
    static async registerDeviceToken(req, res, next) {
        try {
            const userId = req.user.userId;
            const validated = registerDeviceTokenSchema.parse(req.body);
            const device = await notificationService_1.NotificationService.registerDeviceToken({
                userId,
                deviceToken: validated.deviceToken,
                platform: validated.platform,
                deviceName: validated.deviceName,
                appVersion: validated.appVersion,
            });
            (0, response_1.sendSuccess)(res, 'Push notification device token registered.', device);
        }
        catch (err) {
            next(err);
        }
    }
    /**
     * DELETE /api/v1/notifications/device-token
     * Deactivate device token on logout
     */
    static async removeDeviceToken(req, res, next) {
        try {
            const userId = req.user.userId;
            const deviceToken = req.body.deviceToken || req.query.deviceToken;
            const result = await notificationService_1.NotificationService.removeDeviceToken(userId, deviceToken);
            (0, response_1.sendSuccess)(res, 'Device token removed.', result);
        }
        catch (err) {
            next(err);
        }
    }
    /**
     * GET /api/v1/admin/notifications
     * Admin view of all notification deliveries and system broadcasts with server-side pagination and filters
     */
    static async getAdminNotifications(req, res, next) {
        try {
            const page = parseInt(req.query.page || '1', 10);
            const limit = parseInt(req.query.limit || '20', 10);
            const search = req.query.search;
            const role = req.query.role;
            const priority = req.query.priority;
            const isRead = req.query.isRead !== undefined ? req.query.isRead === 'true' : undefined;
            const result = await notificationService_1.NotificationService.getAdminNotificationHistory(page, limit, {
                search,
                role,
                priority,
                isRead,
            });
            (0, response_1.sendSuccess)(res, 'Admin notification history retrieved.', result);
        }
        catch (err) {
            next(err);
        }
    }
    /**
     * POST /api/v1/admin/notifications
     * Admin sends system announcement / broadcast
     */
    static async broadcastAnnouncement(req, res, next) {
        try {
            const adminId = req.user.userId;
            const validated = broadcastAnnouncementSchema.parse(req.body);
            const result = await notificationService_1.NotificationService.broadcastAnnouncement({
                title: validated.title,
                message: validated.message,
                type: validated.type,
                scope: validated.scope,
                targetId: validated.targetId,
                priority: validated.priority,
                data: validated.data,
                adminId,
            });
            (0, response_1.sendSuccess)(res, 'Broadcast announcement sent successfully.', result, 201);
        }
        catch (err) {
            next(err);
        }
    }
}
exports.NotificationController = NotificationController;
//# sourceMappingURL=notificationController.js.map