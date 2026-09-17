import { getSupabaseClient } from '../database/supabaseClient';
import { Complaint, ComplaintStatus } from '../types';

export class ComplaintRepository {
  private static getClient() {
    const client = getSupabaseClient();
    if (!client) throw new Error('Database client not initialized. Please verify SUPABASE_URL and credentials.');
    return client;
  }

  public static async findAll(): Promise<Complaint[]> {
    const { data, error } = await this.getClient()
      .from('complaints')
      .select('*, student:users!complaints_student_id_fkey(*)')
      .order('created_at', { ascending: false });

    if (error) throw new Error(`Fetch complaints error: ${error.message}`);
    return (data || []) as Complaint[];
  }

  public static async findByStudentId(studentId: string): Promise<Complaint[]> {
    const { data, error } = await this.getClient()
      .from('complaints')
      .select('*')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(`Fetch student complaints error: ${error.message}`);
    return (data || []) as Complaint[];
  }

  public static async create(complaint: Partial<Complaint>): Promise<Complaint> {
    const { data, error } = await this.getClient()
      .from('complaints')
      .insert([complaint])
      .select('*')
      .single();

    if (error) throw new Error(`Create complaint error: ${error.message}`);
    return data as Complaint;
  }

  public static async updateStatus(
    id: string,
    status: ComplaintStatus,
    resolutionNotes?: string,
    resolvedBy?: string
  ): Promise<Complaint> {
    const updates: any = {
      status,
      admin_response: resolutionNotes,
      resolved_by: resolvedBy,
      updated_at: new Date().toISOString(),
    };
    if (status === 'RESOLVED') {
      updates.resolved_at = new Date().toISOString();
    }

    const { data, error } = await this.getClient()
      .from('complaints')
      .update(updates)
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw new Error(`Update complaint error: ${error.message}`);
    return data as Complaint;
  }
}
