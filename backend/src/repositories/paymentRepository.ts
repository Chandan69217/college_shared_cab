import { getSupabaseClient } from '../database/supabaseClient';
import { Payment } from '../types';

export class PaymentRepository {
  private static getClient() {
    const client = getSupabaseClient();
    if (!client) throw new Error('Database client not initialized. Please verify SUPABASE_URL and credentials.');
    return client;
  }

  public static async findAll(): Promise<Payment[]> {
    const { data, error } = await this.getClient()
      .from('payments')
      .select('*, student:students(*, user:users(*)), plan:subscription_plans(*)')
      .order('created_at', { ascending: false });

    if (error) throw new Error(`Fetch payments error: ${error.message}`);
    return (data || []) as Payment[];
  }

  public static async findByStudentId(studentId: string): Promise<Payment[]> {
    const { data, error } = await this.getClient()
      .from('payments')
      .select('*, plan:subscription_plans(*)')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(`Fetch student payments error: ${error.message}`);
    return (data || []) as Payment[];
  }

  public static async create(payment: Partial<Payment>): Promise<Payment> {
    const { data, error } = await this.getClient()
      .from('payments')
      .insert([payment])
      .select('*')
      .single();

    if (error) throw new Error(`Create payment error: ${error.message}`);
    return data as Payment;
  }
}
