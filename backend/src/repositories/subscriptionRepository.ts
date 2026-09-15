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
      .select('*')
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
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw new Error(`Fetch plan error: ${error.message}`);
    return data as SubscriptionPlan | null;
  }

  public static async create(plan: Partial<SubscriptionPlan>): Promise<SubscriptionPlan> {
    const { data, error } = await this.getClient()
      .from('subscription_plans')
      .insert([plan])
      .select('*')
      .single();

    if (error) throw new Error(`Create plan error: ${error.message}`);
    return data as SubscriptionPlan;
  }

  public static async update(id: string, updates: Partial<SubscriptionPlan>): Promise<SubscriptionPlan> {
    const { data, error } = await this.getClient()
      .from('subscription_plans')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw new Error(`Update plan error: ${error.message}`);
    return data as SubscriptionPlan;
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
      .select('*, plan:subscription_plans(*), student:users(*)')
      .order('created_at', { ascending: false });

    const { data, error } = await query;
    if (error) throw new Error(`Fetch subscriptions error: ${error.message}`);
    return (data || []) as Subscription[];
  }

  public static async findActiveByStudentId(studentId: string): Promise<Subscription | null> {
    const { data, error } = await this.getClient()
      .from('subscriptions')
      .select('*, plan:subscription_plans(*)')
      .eq('student_id', studentId)
      .eq('status', 'ACTIVE')
      .order('end_date', { ascending: false })
      .maybeSingle();

    if (error) throw new Error(`Fetch active student subscription error: ${error.message}`);
    return data as Subscription | null;
  }

  public static async create(subscription: Partial<Subscription>): Promise<Subscription> {
    const { data, error } = await this.getClient()
      .from('subscriptions')
      .insert([subscription])
      .select('*, plan:subscription_plans(*)')
      .single();

    if (error) throw new Error(`Create subscription error: ${error.message}`);
    return data as Subscription;
  }

  public static async update(id: string, updates: Partial<Subscription>): Promise<Subscription> {
    const { data, error } = await this.getClient()
      .from('subscriptions')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*, plan:subscription_plans(*)')
      .single();

    if (error) throw new Error(`Update subscription error: ${error.message}`);
    return data as Subscription;
  }
}
