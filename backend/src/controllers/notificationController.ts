import { Request, Response, NextFunction } from 'express';
import { NotificationService } from '../services/notificationService';
import { sendSuccess } from '../utils/response';
import { z } from 'zod';

const registerDeviceTokenSchema = z.object({
  deviceToken: z.string().min(1, 'deviceToken is required'),
  platform: z.enum(['android', 'ios', 'web']).default('android'),
  deviceName: z.string().optional(),
  appVersion: z.string().optional(),
});

const broadcastAnnouncementSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  message: z.string().min(1, 'Message is required'),
  type: z.string().default('SYSTEM_ANNOUNCEMENT'),
  scope: z.enum(['ALL', 'STUDENTS', 'DRIVERS', 'COLLEGE', 'ROUTE', 'SPECIFIC_USER']),
  targetId: z.string().uuid().optional(),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'CRITICAL']).default('NORMAL'),
  data: z.record(z.any()).optional(),
});

export class NotificationController {
  /**
   * GET /api/v1/notifications
   * List notifications for authenticated user (student, driver, admin)
   */
  public static async getUserNotifications(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const filter = (req.query.filter as 'ALL' | 'UNREAD') || 'ALL';
      const page = parseInt(req.query.page as string || '1', 10);
      const limit = parseInt(req.query.limit as string || '30', 10);

      const result = await NotificationService.getUserNotifications(userId, filter, page, limit);
      sendSuccess(res, 'Notifications retrieved.', result);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/notifications/unread-count
   * Return real-time unread notification count
   */
  public static async getUnreadCount(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const unreadCount = await NotificationService.getUnreadCount(userId);
      sendSuccess(res, 'Unread notification count retrieved.', { unreadCount });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/notifications/:id/read
   * Mark a single notification as read
   */
  public static async markAsRead(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const userRole = req.user!.role;
      const notificationId = req.params.id;

      const result = await NotificationService.markAsRead(notificationId, userId, userRole);
      sendSuccess(res, 'Notification marked as read.', result);
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/notifications/read-all
   * Mark all notifications as read for current user
   */
  public static async markAllAsRead(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const userRole = req.user!.role;
      const result = await NotificationService.markAllAsRead(userId, userRole);
      sendSuccess(res, 'All notifications marked as read.', result);
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/notifications/device-token
   * Register push device token
   */
  public static async registerDeviceToken(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const validated = registerDeviceTokenSchema.parse(req.body);

      const device = await NotificationService.registerDeviceToken({
        userId,
        deviceToken: validated.deviceToken,
        platform: validated.platform,
        deviceName: validated.deviceName,
        appVersion: validated.appVersion,
      });

      sendSuccess(res, 'Push notification device token registered.', device);
    } catch (err) {
      next(err);
    }
  }

  /**
   * DELETE /api/v1/notifications/device-token
   * Deactivate device token on logout
   */
  public static async removeDeviceToken(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const deviceToken = req.body.deviceToken || (req.query.deviceToken as string);

      const result = await NotificationService.removeDeviceToken(userId, deviceToken);
      sendSuccess(res, 'Device token removed.', result);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/admin/notifications
   * Admin view of all notification deliveries and system broadcasts with server-side pagination and filters
   */
  public static async getAdminNotifications(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string || '1', 10);
      const limit = parseInt(req.query.limit as string || '20', 10);
      const search = req.query.search as string;
      const role = req.query.role as string;
      const priority = req.query.priority as string;
      const isRead = req.query.isRead !== undefined ? req.query.isRead === 'true' : undefined;

      const result = await NotificationService.getAdminNotificationHistory(page, limit, {
        search,
        role,
        priority,
        isRead,
      });
      sendSuccess(res, 'Admin notification history retrieved.', result);
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/admin/notifications
   * Admin sends system announcement / broadcast
   */
  public static async broadcastAnnouncement(req: Request, res: Response, next: NextFunction) {
    try {
      const adminId = req.user!.userId;
      const validated = broadcastAnnouncementSchema.parse(req.body);

      const result = await NotificationService.broadcastAnnouncement({
        title: validated.title,
        message: validated.message,
        type: validated.type as any,
        scope: validated.scope,
        targetId: validated.targetId,
        priority: validated.priority as any,
        data: validated.data,
        adminId,
      });

      sendSuccess(res, 'Broadcast announcement sent successfully.', result, 201);
    } catch (err) {
      next(err);
    }
  }
}
