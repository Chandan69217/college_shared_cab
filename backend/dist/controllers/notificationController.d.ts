import { Request, Response, NextFunction } from 'express';
export declare class NotificationController {
    /**
     * GET /api/v1/notifications
     * List notifications for authenticated user (student, driver, admin)
     */
    static getUserNotifications(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * GET /api/v1/notifications/unread-count
     * Return real-time unread notification count
     */
    static getUnreadCount(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * POST /api/v1/notifications/:id/read
     * Mark a single notification as read
     */
    static markAsRead(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * POST /api/v1/notifications/read-all
     * Mark all notifications as read for current user
     */
    static markAllAsRead(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * POST /api/v1/notifications/device-token
     * Register push device token
     */
    static registerDeviceToken(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * DELETE /api/v1/notifications/device-token
     * Deactivate device token on logout
     */
    static removeDeviceToken(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * GET /api/v1/admin/notifications
     * Admin view of all notification deliveries and system broadcasts with server-side pagination and filters
     */
    static getAdminNotifications(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * POST /api/v1/admin/notifications
     * Admin sends system announcement / broadcast
     */
    static broadcastAnnouncement(req: Request, res: Response, next: NextFunction): Promise<void>;
}
