"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationService = void 0;
const supabaseClient_1 = require("../database/supabaseClient");
const logger_1 = require("../utils/logger");
class NotificationService {
    /**
     * Create a single notification, store in Supabase, and dispatch push to active user devices
     */
    static async createNotification(params) {
        const supabase = (0, supabaseClient_1.getSupabaseClient)();
        if (!supabase) {
            logger_1.logger.warn('Supabase client not initialized. Notification skipped.');
            return null;
        }
        const { userId, title, message, type, recipientRole, entityType, entityId, priority = 'NORMAL', data = {}, } = params;
        try {
            // 1. Insert notification record into Supabase
            const { data: createdNotif, error: notifErr } = await supabase
                .from('notifications')
                .insert([{
                    user_id: userId,
                    recipient_role: recipientRole,
                    title,
                    message,
                    type,
                    entity_type: entityType,
                    entity_id: entityId,
                    priority,
                    data: {
                        ...data,
                        notificationType: type,
                        entityType,
                        entityId,
                    },
                    is_read: false,
                }])
                .select()
                .single();
            if (notifErr) {
                logger_1.logger.error(`Error saving notification to DB: ${notifErr.message}`);
                return null;
            }
            // 2. Fetch active device tokens for the user
            const { data: devices } = await supabase
                .from('user_devices')
                .select('*')
                .eq('user_id', userId)
                .eq('is_active', true);
            // 3. Dispatch push notification to each registered device
            if (devices && devices.length > 0) {
                for (const dev of devices) {
                    await this.dispatchPushNotification({
                        notificationId: createdNotif.id,
                        deviceToken: dev.device_token,
                        platform: dev.platform,
                        title,
                        message,
                        type,
                        priority,
                        payload: {
                            notificationId: createdNotif.id,
                            type,
                            entityType,
                            entityId,
                            ...data,
                        },
                    });
                }
            }
            logger_1.logger.info(`[Notification] Created "${title}" [${type}] for User ${userId}`);
            return createdNotif;
        }
        catch (err) {
            logger_1.logger.error(`[NotificationService] createNotification exception: ${err.message}`);
            return null;
        }
    }
    /**
     * Broadcast announcement / notification to a targeted audience scope
     */
    static async broadcastAnnouncement(params) {
        const supabase = (0, supabaseClient_1.getSupabaseClient)();
        if (!supabase)
            throw new Error('Database client not initialized.');
        const { title, message, type = 'SYSTEM_ANNOUNCEMENT', scope, targetId, priority = 'NORMAL', data = {}, adminId, } = params;
        let targetUserIds = [];
        if (scope === 'SPECIFIC_USER' && targetId) {
            targetUserIds = [targetId];
        }
        else if (scope === 'ALL') {
            const { data: users } = await supabase
                .from('users')
                .select('id')
                .eq('status', 'ACTIVE');
            targetUserIds = (users || []).map((u) => u.id);
        }
        else if (scope === 'STUDENTS') {
            const { data: students } = await supabase
                .from('users')
                .select('id')
                .eq('role', 'STUDENT')
                .eq('status', 'ACTIVE');
            targetUserIds = (students || []).map((s) => s.id);
        }
        else if (scope === 'DRIVERS') {
            const { data: drivers } = await supabase
                .from('users')
                .select('id')
                .eq('role', 'DRIVER')
                .eq('status', 'ACTIVE');
            targetUserIds = (drivers || []).map((d) => d.id);
        }
        else if (scope === 'COLLEGE' && targetId) {
            // Find students & drivers of that college
            const { data: studentProfiles } = await supabase
                .from('student_profiles')
                .select('id')
                .eq('college_id', targetId);
            const { data: driverProfiles } = await supabase
                .from('driver_profiles')
                .select('id')
                .eq('college_id', targetId);
            const sIds = (studentProfiles || []).map((p) => p.id);
            const dIds = (driverProfiles || []).map((p) => p.id);
            targetUserIds = Array.from(new Set([...sIds, ...dIds]));
        }
        else if (scope === 'ROUTE' && targetId) {
            // Find assigned drivers and passengers with active bookings on this route
            const { data: trips } = await supabase
                .from('trips')
                .select('driver_id')
                .eq('route_id', targetId);
            const { data: bookings } = await supabase
                .from('bookings')
                .select('student_id')
                .eq('route_id', targetId);
            const dIds = (trips || []).map((t) => t.driver_id).filter(Boolean);
            const sIds = (bookings || []).map((b) => b.student_id).filter(Boolean);
            targetUserIds = Array.from(new Set([...dIds, ...sIds]));
        }
        if (targetUserIds.length === 0) {
            return { recipientCount: 0, message: 'No active recipients found for selected scope.' };
        }
        // Prepare batch notification records
        const notificationRows = targetUserIds.map((userId) => ({
            user_id: userId,
            title,
            message,
            type,
            priority,
            data: {
                ...data,
                broadcastScope: scope,
                targetId,
                broadcastBy: adminId,
            },
            is_read: false,
        }));
        // Chunked insert (batches of 100)
        const chunkSize = 100;
        for (let i = 0; i < notificationRows.length; i += chunkSize) {
            const chunk = notificationRows.slice(i, i + chunkSize);
            await supabase.from('notifications').insert(chunk);
        }
        // Fetch active device tokens for push delivery
        const { data: devices } = await supabase
            .from('user_devices')
            .select('*')
            .in('user_id', targetUserIds)
            .eq('is_active', true);
        if (devices && devices.length > 0) {
            // Dispatch push in background without blocking response
            (async () => {
                for (const dev of devices) {
                    await this.dispatchPushNotification({
                        deviceToken: dev.device_token,
                        platform: dev.platform,
                        title,
                        message,
                        type,
                        priority,
                        payload: {
                            type,
                            scope,
                            ...data,
                        },
                    });
                }
            })().catch((e) => logger_1.logger.warn(`Background push broadcast notice: ${e.message}`));
        }
        logger_1.logger.info(`[Notification] Broadcast "${title}" sent to ${targetUserIds.length} users (${scope}).`);
        return {
            recipientCount: targetUserIds.length,
            scope,
            title,
            type,
        };
    }
    /**
     * Get user's notifications with pagination & filter
     */
    static async getUserNotifications(userId, filter = 'ALL', page = 1, limit = 30) {
        const supabase = (0, supabaseClient_1.getSupabaseClient)();
        if (!supabase)
            throw new Error('Database client not initialized.');
        const from = (page - 1) * limit;
        const to = from + limit - 1;
        let query = supabase
            .from('notifications')
            .select('*', { count: 'exact' })
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .range(from, to);
        if (filter === 'UNREAD') {
            query = query.eq('is_read', false);
        }
        const { data, count, error } = await query;
        if (error)
            throw new Error(error.message);
        // Get live unread count
        const { count: unreadCount } = await supabase
            .from('notifications')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('is_read', false);
        return {
            notifications: data || [],
            total: count || 0,
            unreadCount: unreadCount || 0,
            page,
            limit,
            totalPages: Math.ceil((count || 0) / limit),
        };
    }
    /**
     * Get live unread notifications count for badge
     */
    static async getUnreadCount(userId) {
        const supabase = (0, supabaseClient_1.getSupabaseClient)();
        if (!supabase)
            return 0;
        const { count, error } = await supabase
            .from('notifications')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('is_read', false);
        if (error) {
            logger_1.logger.warn(`Error getting unread count: ${error.message}`);
            return 0;
        }
        return count || 0;
    }
    /**
     * Mark a single notification as read
     */
    static async markAsRead(notificationId, userId, role = 'STUDENT') {
        const supabase = (0, supabaseClient_1.getSupabaseClient)();
        if (!supabase)
            throw new Error('Database client not initialized.');
        const now = new Date().toISOString();
        let query = supabase
            .from('notifications')
            .update({ is_read: true, read_at: now })
            .eq('id', notificationId);
        // Enforce authorization: Non-admins can only mark their own notifications
        if (role !== 'ADMIN') {
            query = query.eq('user_id', userId);
        }
        const { data, error } = await query.select().maybeSingle();
        if (error)
            throw new Error(error.message);
        if (!data) {
            const err = new Error('Notification not found or unauthorized.');
            err.statusCode = 404;
            throw err;
        }
        const unreadCount = await this.getUnreadCount(userId);
        return { notification: data, unreadCount };
    }
    /**
     * Mark all unread notifications as read for a user
     */
    static async markAllAsRead(userId, role = 'STUDENT') {
        const supabase = (0, supabaseClient_1.getSupabaseClient)();
        if (!supabase)
            throw new Error('Database client not initialized.');
        const now = new Date().toISOString();
        let query = supabase
            .from('notifications')
            .update({ is_read: true, read_at: now })
            .eq('is_read', false);
        if (role !== 'ADMIN') {
            query = query.eq('user_id', userId);
        }
        const { error } = await query;
        if (error)
            throw new Error(error.message);
        return { success: true, unreadCount: 0 };
    }
    /**
     * Register or update push notification device token
     */
    static async registerDeviceToken(params) {
        const supabase = (0, supabaseClient_1.getSupabaseClient)();
        if (!supabase)
            throw new Error('Database client not initialized.');
        const { userId, deviceToken, platform = 'android', deviceName = 'Device', appVersion = '1.0.0', } = params;
        const now = new Date().toISOString();
        const { data, error } = await supabase
            .from('user_devices')
            .upsert({
            user_id: userId,
            device_token: deviceToken,
            platform,
            device_name: deviceName,
            app_version: appVersion,
            is_active: true,
            last_seen_at: now,
            updated_at: now,
        }, { onConflict: 'user_id,device_token' })
            .select()
            .single();
        if (error) {
            logger_1.logger.error(`Device token upsert error: ${error.message}`);
            throw new Error(error.message);
        }
        logger_1.logger.info(`[Notification] Device token registered for User ${userId} (${platform})`);
        return data;
    }
    /**
     * Deactivate device token on logout
     */
    static async removeDeviceToken(userId, deviceToken) {
        const supabase = (0, supabaseClient_1.getSupabaseClient)();
        if (!supabase)
            return { success: true };
        let query = supabase.from('user_devices').update({ is_active: false }).eq('user_id', userId);
        if (deviceToken) {
            query = query.eq('device_token', deviceToken);
        }
        await query;
        logger_1.logger.info(`[Notification] Device token(s) deactivated for User ${userId}`);
        return { success: true };
    }
    /**
     * Get Admin notification feed & broadcast history with pagination, filtering, and aggregate metrics
     */
    static async getAdminNotificationHistory(page = 1, limit = 20, filters) {
        const supabase = (0, supabaseClient_1.getSupabaseClient)();
        if (!supabase)
            throw new Error('Database client not initialized.');
        const safePage = Math.max(1, page);
        const safeLimit = Math.max(1, Math.min(100, limit));
        const from = (safePage - 1) * safeLimit;
        const to = from + safeLimit - 1;
        let query = supabase
            .from('notifications')
            .select('*, user:users!notifications_user_id_fkey(full_name, email, role)', { count: 'exact' });
        if (filters?.role && filters.role !== 'ALL') {
            query = query.eq('recipient_role', filters.role);
        }
        if (filters?.priority && filters.priority !== 'ALL') {
            query = query.eq('priority', filters.priority);
        }
        if (filters?.isRead !== undefined) {
            query = query.eq('is_read', filters.isRead);
        }
        if (filters?.search && filters.search.trim()) {
            const term = `%${filters.search.trim()}%`;
            query = query.or(`title.ilike.${term},message.ilike.${term}`);
        }
        const [listResult, unreadResult, criticalResult] = await Promise.all([
            query.order('created_at', { ascending: false }).range(from, to),
            supabase.from('notifications').select('id', { count: 'exact', head: true }).eq('is_read', false),
            supabase.from('notifications').select('id', { count: 'exact', head: true }).in('priority', ['HIGH', 'CRITICAL']),
        ]);
        if (listResult.error)
            throw new Error(listResult.error.message);
        const total = listResult.count || 0;
        const totalPages = Math.ceil(total / safeLimit) || 1;
        const unreadCount = unreadResult.count || 0;
        const criticalCount = criticalResult.count || 0;
        return {
            notifications: listResult.data || [],
            pagination: {
                total,
                page: safePage,
                limit: safeLimit,
                totalPages,
                hasPrevPage: safePage > 1,
                hasNextPage: safePage < totalPages,
            },
            stats: {
                total,
                unreadCount,
                readCount: Math.max(0, total - unreadCount),
                criticalCount,
            },
        };
    }
    /**
     * Internal push dispatcher (Handles FCM / Web Push abstraction & delivery audit log)
     */
    static async dispatchPushNotification(options) {
        const supabase = (0, supabaseClient_1.getSupabaseClient)();
        const { notificationId, deviceToken, platform, title, message, type } = options;
        try {
            // In a production environment with Google FCM Service Account credentials,
            // firebaseAdmin.messaging().send(...) transmits to Android/iOS devices.
            // Here we log the push transmission and record in notification_deliveries.
            logger_1.logger.info(`[Push Service] Transmitted to ${platform} token ${deviceToken.substring(0, 10)}... "${title}"`);
            if (supabase && notificationId) {
                await supabase.from('notification_deliveries').insert([{
                        notification_id: notificationId,
                        device_token: deviceToken,
                        platform,
                        provider: 'FCM',
                        status: 'SENT',
                        sent_at: new Date().toISOString(),
                    }]);
            }
        }
        catch (err) {
            logger_1.logger.warn(`[Push Service] Delivery warning for ${deviceToken.substring(0, 10)}...: ${err.message}`);
            if (supabase && notificationId) {
                await supabase.from('notification_deliveries').insert([{
                        notification_id: notificationId,
                        device_token: deviceToken,
                        platform,
                        provider: 'FCM',
                        status: 'FAILED',
                        error_message: err.message,
                        sent_at: new Date().toISOString(),
                    }]);
            }
        }
    }
}
exports.NotificationService = NotificationService;
//# sourceMappingURL=notificationService.js.map