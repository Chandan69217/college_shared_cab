import { getSupabaseClient } from '../database/supabaseClient';
import { PickupPoint } from '../types';

export class PickupPointRepository {
  private static getClient() {
    const client = getSupabaseClient();
    if (!client) throw new Error('Database client not initialized. Please verify SUPABASE_URL and credentials.');
    return client;
  }

  public static async findAll(collegeId?: string): Promise<PickupPoint[]> {
    let query = this.getClient()
      .from('pickup_points')
      .select('*')
      .order('name');

    if (collegeId) {
      query = query.eq('college_id', collegeId);
    }

    const { data, error } = await query;
    if (error) throw new Error(`Fetch pickup points error: ${error.message}`);
    return (data || []) as PickupPoint[];
  }

  public static async findById(id: string): Promise<PickupPoint | null> {
    const { data, error } = await this.getClient()
      .from('pickup_points')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw new Error(`Fetch pickup point error: ${error.message}`);
    return data as PickupPoint | null;
  }

  public static async create(point: Partial<PickupPoint>): Promise<PickupPoint> {
    const { data, error } = await this.getClient()
      .from('pickup_points')
      .insert([point])
      .select('*')
      .single();

    if (error) throw new Error(`Create pickup point error: ${error.message}`);
    return data as PickupPoint;
  }

  public static async update(id: string, updates: Partial<PickupPoint>): Promise<PickupPoint> {
    const { data, error } = await this.getClient()
      .from('pickup_points')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw new Error(`Update pickup point error: ${error.message}`);
    return data as PickupPoint;
  }

  public static async delete(id: string): Promise<void> {
    const client = this.getClient();
    const point = await this.findById(id);
    if (!point) {
      const err: any = new Error('Pickup point not found.');
      err.statusCode = 404;
      err.code = 'NOT_FOUND';
      throw err;
    }

    // Check if used in route stops
    const { count: stopCount } = await client
      .from('route_stops')
      .select('id', { count: 'exact', head: true })
      .eq('pickup_point_id', id);

    if (stopCount && stopCount > 0) {
      const err: any = new Error(
        `Cannot delete pickup point "${point.name}". It is currently assigned to ${stopCount} route stop(s). Please remove it from route schedules or deactivate it instead.`
      );
      err.statusCode = 409;
      err.code = 'ACTIVE_RELATIONSHIP_EXISTS';
      throw err;
    }

    // Check if referenced in active bookings
    const { count: bookingCount } = await client
      .from('student_bookings')
      .select('id', { count: 'exact', head: true })
      .or(`pickup_point_id.eq.${id},drop_point_id.eq.${id}`)
      .in('status', ['CONFIRMED', 'BOARDED']);

    if (bookingCount && bookingCount > 0) {
      const err: any = new Error(
        `Cannot delete pickup point "${point.name}". It is associated with ${bookingCount} active or confirmed student ride booking(s).`
      );
      err.statusCode = 409;
      err.code = 'ACTIVE_RELATIONSHIP_EXISTS';
      throw err;
    }

    const { error } = await client
      .from('pickup_points')
      .delete()
      .eq('id', id);

    if (error) throw new Error(`Delete pickup point error: ${error.message}`);
  }
}
