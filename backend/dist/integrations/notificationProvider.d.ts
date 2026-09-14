import { NotificationType } from '../types';
export declare class NotificationProvider {
    /**
     * Sends in-app and simulated push notification
     */
    static send(userId: string, title: string, message: string, type: NotificationType, data?: Record<string, any>): Promise<void>;
    /**
     * Broadcasts to all users of a specific role
     */
    static broadcastToRole(role: 'STUDENT' | 'DRIVER' | 'ALL', title: string, message: string, type?: NotificationType): Promise<number>;
}
