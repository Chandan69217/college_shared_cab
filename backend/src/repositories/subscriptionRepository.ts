import { getSupabaseClient } from '../database/supabaseClient';
import { SubscriptionPlan, Subscription } from '../types';

export class PlanRepository {
  private static getClient() {
    const client = getSupabaseClient();
    if (!client) throw new Error('Database client not initialized. Please verify SUPABASE_URL and credentials.');
    return client;
  }

  public static async findAll(collegeId?: string): Promise<SubscriptionPlan[]> {
    let query = this.getClient()
      .from('subscription_plans')
      .select('*, college:colleges(*)')
      .order('price');

    if (collegeId) {
      query = query.eq('college_id', collegeId);
    }

    const { data, error } = await query;
    if (error) throw new Error(`Fetch subscription plans error: ${error.message}`);
    return (data || []) as SubscriptionPlan[];
  }

  public static async findById(id: string): Promise<SubscriptionPlan | null> {
    const { data, error } = await this.getClient()
      .from('subscription_plans')
      .select('*, college:colleges(*)')
      .eq('id', id)
      .maybeSingle();

    if (error) throw new Error(`Fetch plan error: ${error.message}`);
    return data as SubscriptionPlan | null;
  }

  public static async create(plan: Partial<SubscriptionPlan>): Promise<SubscriptionPlan> {
    const { data, error } = await this.getClient()
      .from('subscription_plans')
      .insert([plan])
      .select('*, college:colleges(*)')
      .single();

    if (error) throw new Error(`Create plan error: ${error.message}`);
    return data as SubscriptionPlan;
  }

  public static async update(id: string, updates: Partial<SubscriptionPlan>): Promise<SubscriptionPlan> {
    const { data, error } = await this.getClient()
      .from('subscription_plans')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*, college:colleges(*)')
      .single();

    if (error) throw new Error(`Update plan error: ${error.message}`);
    return data as SubscriptionPlan;
  }

  public static async delete(id: string): Promise<void> {
    const { error } = await this.getClient()
      .from('subscription_plans')
      .delete()
      .eq('id', id);

    if (error) throw new Error(`Delete plan error: ${error.message}`);
  }
}

export class SubscriptionRepository {
  private static getClient() {
    const client = getSupabaseClient();
    if (!client) throw new Error('Database client not initialized. Please verify SUPABASE_URL and credentials.');
    return client;
  }

  public static async findAll(collegeId?: string): Promise<Subscription[]> {
    const query = this.getClient()
      .from('subscriptions')
      .select('*, plan:subscription_plans(*, college:colleges(*)), student:users!subscriptions_student_id_fkey(*)')
      .order('created_at', { ascending: false });

    const { data, error } = await query;
    if (error) throw new Error(`Fetch subscriptions error: ${error.message}`);
    
    const studentIds = Array.from(new Set((data || []).map((s: any) => s.student_id).filter(Boolean)));
    let profileMap: Record<string, any> = {};
    if (studentIds.length > 0) {
      const { data: profiles } = await this.getClient()
        .from('student_profiles')
        .select('*, college:colleges(*)')
        .in('id', studentIds);
      if (profiles) {
        profiles.forEach((p: any) => {
          profileMap[p.id] = p;
        });
      }
    }

    return ((data || []) as any[]).map((s: any) => {
      const studentUser = s.student;
      const studentProfile = profileMap[s.student_id];
      return {
        ...s,
        student_name: studentUser?.full_name || 'N/A',
        student_email: studentUser?.email || 'N/A',
        student_phone: studentUser?.phone || 'N/A',
        student_id_number: studentProfile?.student_id_number || 'N/A',
        college_name: studentProfile?.college?.name || s.plan?.college?.name || 'N/A',
        plan_name: s.plan?.name || 'N/A',
        rides_remaining: s.remaining_rides ?? s.total_rides_allocated ?? 0,
        rides_allocated: s.total_rides_allocated ?? s.plan?.ride_count_total ?? 0,
      };
    }) as Subscription[];
  }

  public static async findActiveByStudentId(studentId: string): Promise<Subscription | null> {
    const { data, error } = await this.getClient()
      .from('subscriptions')
      .select('*, plan:subscription_plans(*, college:colleges(*))')
      .eq('student_id', studentId)
      .eq('status', 'ACTIVE')
      .order('end_date', { ascending: false })
      .limit(1);

    if (error) throw new Error(`Fetch active student subscription error: ${error.message}`);
    return (data && data.length > 0) ? (data[0] as Subscription) : null;
  }

  public static async create(subscription: Partial<Subscription>): Promise<Subscription> {
    const { data, error } = await this.getClient()
      .from('subscriptions')
      .insert([subscription])
      .select('*, plan:subscription_plans(*, college:colleges(*))')
      .single();

    if (error) throw new Error(`Create subscription error: ${error.message}`);
    return data as Subscription;
  }

  public static async update(id: string, updates: Partial<Subscription>): Promise<Subscription> {
    const { data, error } = await this.getClient()
      .from('subscriptions')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*, plan:subscription_plans(*, college:colleges(*))')
      .single();

    if (error) throw new Error(`Update subscription error: ${error.message}`);
    return data as Subscription;
  }
}
