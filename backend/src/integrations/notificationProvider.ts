import { NotificationService } from '../services/notificationService';
import { NotificationType, NotificationPriority, UserRole } from '../types';

export class NotificationProvider {
  /**
   * Sends in-app and push notification via centralized NotificationService
   */
  public static async send(
    userId: string,
    title: string,
    message: string,
    type: NotificationType,
    data: Record<string, any> = {},
    options: {
      recipientRole?: UserRole;
      entityType?: string;
      entityId?: string;
      priority?: NotificationPriority;
    } = {}
  ): Promise<void> {
    await NotificationService.createNotification({
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
  public static async broadcastToRole(
    role: 'STUDENT' | 'DRIVER' | 'ALL',
    title: string,
    message: string,
    type: NotificationType = 'GENERAL'
  ): Promise<number> {
    const scope = role === 'STUDENT' ? 'STUDENTS' : role === 'DRIVER' ? 'DRIVERS' : 'ALL';
    const result = await NotificationService.broadcastAnnouncement({
      title,
      message,
      type,
      scope,
    });
    return result.recipientCount;
  }
}
