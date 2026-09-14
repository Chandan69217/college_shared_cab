import { db } from '../database/db';
import { NotificationType } from '../types';
import { logger } from '../utils/logger';

export class NotificationProvider {
  /**
   * Sends in-app and simulated push notification
   */
  public static async send(
    userId: string,
    title: string,
    message: string,
    type: NotificationType,
    data: Record<string, any> = {}
  ): Promise<void> {
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

    db.notifications.set(notifId, notification);
    logger.info(`Notification sent to User ${userId}: "${title}" [${type}]`);
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
    let count = 0;
    for (const [userId, user] of db.users.entries()) {
      if (role === 'ALL' || user.role === role) {
        await this.send(userId, title, message, type);
        count++;
      }
    }
    return count;
  }
}
