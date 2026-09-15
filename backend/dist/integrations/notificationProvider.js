"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationProvider = void 0;
const supabaseClient_1 = require("../database/supabaseClient");
const logger_1 = require("../utils/logger");
class NotificationProvider {
    /**
     * Sends in-app and simulated push notification to Supabase notifications table
     */
    static async send(userId, title, message, type, data = {}) {
        const supabase = (0, supabaseClient_1.getSupabaseClient)();
        if (supabase) {
            await supabase.from('notifications').insert([{
                    user_id: userId,
                    title,
                    message,
                    type,
                    is_read: false,
                    data,
                }]).select().maybeSingle();
        }
        logger_1.logger.info(`Notification sent to User ${userId}: "${title}" [${type}]`);
    }
    /**
     * Broadcasts to all users of a specific role
     */
    static async broadcastToRole(role, title, message, type = 'GENERAL') {
        const supabase = (0, supabaseClient_1.getSupabaseClient)();
        if (!supabase)
            return 0;
        let query = supabase.from('users').select('id, role');
        if (role !== 'ALL') {
            query = query.eq('role', role);
        }
        const { data: users } = await query;
        if (!users || users.length === 0)
            return 0;
        const notifs = users.map((u) => ({
            user_id: u.id,
            title,
            message,
            type,
            is_read: false,
        }));
        await supabase.from('notifications').insert(notifs);
        return users.length;
    }
}
exports.NotificationProvider = NotificationProvider;
//# sourceMappingURL=notificationProvider.js.map