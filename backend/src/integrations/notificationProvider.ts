import { getSupabaseClient } from '../database/supabaseClient';
import { NotificationType } from '../types';
import { logger } from '../utils/logger';

export class NotificationProvider {
  /**
   * Sends in-app and simulated push notification to Supabase notifications table
   */
  public static async send(
    userId: string,
    title: string,
    message: string,
    type: NotificationType,
    data: Record<string, any> = {}
  ): Promise<void> {
    const supabase = getSupabaseClient();
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
    const supabase = getSupabaseClient();
    if (!supabase) return 0;

    let query = supabase.from('users').select('id, role');
    if (role !== 'ALL') {
      query = query.eq('role', role);
    }
    const { data: users } = await query;
    if (!users || users.length === 0) return 0;

    const notifs = users.map((u: any) => ({
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
