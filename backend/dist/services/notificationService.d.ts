import { NotificationType, NotificationPriority, UserRole } from '../types';
export interface CreateNotificationParams {
    userId: string;
    title: string;
    message: string;
    type: NotificationType;
    recipientRole?: UserRole;
    entityType?: string;
    entityId?: string;
    priority?: NotificationPriority;
    data?: Record<string, any>;
}
export interface BroadcastNotificationParams {
    title: string;
    message: string;
    type?: NotificationType;
    scope: 'ALL' | 'STUDENTS' | 'DRIVERS' | 'COLLEGE' | 'ROUTE' | 'SPECIFIC_USER';
    targetId?: string;
    priority?: NotificationPriority;
    data?: Record<string, any>;
    adminId?: string;
}
export declare class NotificationService {
    /**
     * Create a single notification, store in Supabase, and dispatch push to active user devices
     */
    static createNotification(params: CreateNotificationParams): Promise<any>;
    /**
     * Broadcast announcement / notification to a targeted audience scope
     */
    static broadcastAnnouncement(params: BroadcastNotificationParams): Promise<{
        recipientCount: number;
        message: string;
        scope?: undefined;
        title?: undefined;
        type?: undefined;
    } | {
        recipientCount: number;
        scope: "ALL" | "STUDENTS" | "DRIVERS" | "COLLEGE" | "ROUTE" | "SPECIFIC_USER";
        title: string;
        type: "MAINTENANCE" | "BOOKING" | "PAYMENT" | "SUBSCRIPTION" | "BOOKING_CREATED" | "BOOKING_CONFIRMED" | "BOOKING_ACCEPTED" | "BOOKING_REJECTED" | "BOOKING_CANCELLED" | "NEW_RIDE_REQUEST" | "DRIVER_ASSIGNED" | "VEHICLE_ASSIGNED" | "TRIP_STARTED" | "TRIP_COMPLETED" | "TRIP_CANCELLED" | "TRIP_DELAYED" | "DRIVER_ON_DUTY" | "DRIVER_OFF_DUTY" | "VEHICLE_APPROACHING" | "VEHICLE_ARRIVED" | "PICKUP_REMINDER" | "DROP_REMINDER" | "BOARDING_CONFIRMED" | "PASSENGER_NOT_BOARDED" | "SUBSCRIPTION_PURCHASED" | "SUBSCRIPTION_ACTIVATED" | "SUBSCRIPTION_EXPIRING" | "SUBSCRIPTION_EXPIRED" | "PAYMENT_SUCCESS" | "PAYMENT_FAILED" | "PAYMENT_REFUNDED" | "DAILY_PASS_AVAILABLE" | "QR_GENERATED" | "QR_INVALID" | "QR_ALREADY_USED" | "ROUTE_CHANGED" | "PICKUP_POINT_CHANGED" | "COMPLAINT_CREATED" | "COMPLAINT_UPDATED" | "COMPLAINT_RESOLVED" | "ACCOUNT_CREATED" | "ACCOUNT_UPDATED" | "ACCOUNT_VERIFIED" | "ACCOUNT_REJECTED" | "KYC_SUBMITTED" | "SYSTEM_ANNOUNCEMENT" | "IMPORTANT_ALERT" | "ROUTE_UPDATE" | "SERVICE_UPDATE" | "EMERGENCY_SOS" | "TRIP" | "EMERGENCY" | "GENERAL";
        message?: undefined;
    }>;
    /**
     * Get user's notifications with pagination & filter
     */
    static getUserNotifications(userId: string, filter?: 'ALL' | 'UNREAD', page?: number, limit?: number): Promise<{
        notifications: any[];
        total: number;
        unreadCount: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    /**
     * Get live unread notifications count for badge
     */
    static getUnreadCount(userId: string): Promise<number>;
    /**
     * Mark a single notification as read
     */
    static markAsRead(notificationId: string, userId: string, role?: string): Promise<{
        notification: any;
        unreadCount: number;
    }>;
    /**
     * Mark all unread notifications as read for a user
     */
    static markAllAsRead(userId: string, role?: string): Promise<{
        success: boolean;
        unreadCount: number;
    }>;
    /**
     * Register or update push notification device token
     */
    static registerDeviceToken(params: {
        userId: string;
        deviceToken: string;
        platform?: 'android' | 'ios' | 'web';
        deviceName?: string;
        appVersion?: string;
    }): Promise<any>;
    /**
     * Deactivate device token on logout
     */
    static removeDeviceToken(userId: string, deviceToken?: string): Promise<{
        success: boolean;
    }>;
    /**
     * Get Admin notification feed & broadcast history with pagination, filtering, and aggregate metrics
     */
    static getAdminNotificationHistory(page?: number, limit?: number, filters?: {
        search?: string;
        role?: string;
        priority?: string;
        isRead?: boolean;
    }): Promise<{
        notifications: any[];
        pagination: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
            hasPrevPage: boolean;
            hasNextPage: boolean;
        };
        stats: {
            total: number;
            unreadCount: number;
            readCount: number;
            criticalCount: number;
        };
    }>;
    /**
     * Internal push dispatcher (Handles FCM / Web Push abstraction & delivery audit log)
     */
    private static dispatchPushNotification;
}
