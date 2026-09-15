import { getSupabaseClient } from '../database/supabaseClient';
import { Vehicle } from '../types';

export class VehicleRepository {
  private static getClient() {
    const client = getSupabaseClient();
    if (!client) throw new Error('Database client not initialized. Please verify SUPABASE_URL and credentials.');
    return client;
  }

  public static async findAll(collegeId?: string): Promise<Vehicle[]> {
    let query = this.getClient()
      .from('vehicles')
      .select('*')
      .order('vehicle_number');

    if (collegeId) {
      query = query.eq('college_id', collegeId);
    }

    const { data, error } = await query;
    if (error) throw new Error(`Fetch vehicles error: ${error.message}`);
    return (data || []) as Vehicle[];
  }

  public static async findById(id: string): Promise<Vehicle | null> {
    const { data, error } = await this.getClient()
      .from('vehicles')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw new Error(`Fetch vehicle error: ${error.message}`);
    return data as Vehicle | null;
  }

  public static async create(vehicle: Partial<Vehicle>): Promise<Vehicle> {
    const { data, error } = await this.getClient()
      .from('vehicles')
      .insert([vehicle])
      .select('*')
      .single();

    if (error) throw new Error(`Create vehicle error: ${error.message}`);
    return data as Vehicle;
  }

  public static async update(id: string, updates: Partial<Vehicle>): Promise<Vehicle> {
    const { data, error } = await this.getClient()
      .from('vehicles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw new Error(`Update vehicle error: ${error.message}`);
    return data as Vehicle;
  }

  public static async delete(id: string): Promise<void> {
    const client = this.getClient();

    // Check if vehicle is assigned to active routes
    const { data: routes } = await client
      .from('routes')
      .select('id, name')
      .eq('default_vehicle_id', id)
      .eq('is_active', true);

    if (routes && routes.length > 0) {
      const err: any = new Error(
        `Cannot delete vehicle: Assigned as default vehicle for active route "${routes[0].name}". Reassign the route vehicle or set vehicle status to MAINTENANCE/INACTIVE instead.`
      );
      err.statusCode = 409;
      err.code = 'ACTIVE_RELATIONSHIP_EXISTS';
      throw err;
    }

    // Check if vehicle has active/scheduled trips
    const { data: trips } = await client
      .from('trips')
      .select('id, trip_date')
      .eq('vehicle_id', id)
      .in('status', ['SCHEDULED', 'IN_PROGRESS']);

    if (trips && trips.length > 0) {
      const err: any = new Error(
        `Cannot delete vehicle: Assigned to ${trips.length} active or scheduled trip(s). Reassign trips or update vehicle status to MAINTENANCE instead.`
      );
      err.statusCode = 409;
      err.code = 'ACTIVE_RELATIONSHIP_EXISTS';
      throw err;
    }

    const { error } = await client
      .from('vehicles')
      .delete()
      .eq('id', id);

    if (error) throw new Error(`Delete vehicle error: ${error.message}`);
  }
}
