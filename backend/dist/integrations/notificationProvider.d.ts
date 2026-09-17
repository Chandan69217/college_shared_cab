import { NotificationType, NotificationPriority, UserRole } from '../types';
export declare class NotificationProvider {
    /**
     * Sends in-app and push notification via centralized NotificationService
     */
    static send(userId: string, title: string, message: string, type: NotificationType, data?: Record<string, any>, options?: {
        recipientRole?: UserRole;
        entityType?: string;
        entityId?: string;
        priority?: NotificationPriority;
    }): Promise<void>;
    /**
     * Broadcasts to all users of a specific role
     */
    static broadcastToRole(role: 'STUDENT' | 'DRIVER' | 'ALL', title: string, message: string, type?: NotificationType): Promise<number>;
}
