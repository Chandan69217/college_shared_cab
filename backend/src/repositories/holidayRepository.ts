import { getSupabaseClient } from '../database/supabaseClient';
import { CollegeHoliday } from '../types';

export class HolidayRepository {
  private static getClient() {
    const client = getSupabaseClient();
    if (!client) throw new Error('Database client not initialized. Please verify SUPABASE_URL and credentials.');
    return client;
  }

  public static async findAll(collegeId?: string): Promise<CollegeHoliday[]> {
    let query = this.getClient()
      .from('college_holidays')
      .select('*')
      .order('holiday_date');

    if (collegeId) {
      query = query.eq('college_id', collegeId);
    }

    const { data, error } = await query;
    if (error) throw new Error(`Fetch holidays error: ${error.message}`);
    return (data || []) as CollegeHoliday[];
  }

  public static async create(holiday: Partial<CollegeHoliday>): Promise<CollegeHoliday> {
    const { data, error } = await this.getClient()
      .from('college_holidays')
      .insert([holiday])
      .select('*')
      .single();

    if (error) throw new Error(`Create holiday error: ${error.message}`);
    return data as CollegeHoliday;
  }

  public static async delete(id: string): Promise<void> {
    const { error } = await this.getClient()
      .from('college_holidays')
      .delete()
      .eq('id', id);

    if (error) throw new Error(`Delete holiday error: ${error.message}`);
  }
}
