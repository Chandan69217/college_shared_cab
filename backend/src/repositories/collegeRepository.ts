import { getSupabaseClient } from '../database/supabaseClient';
import { College } from '../types';

export class CollegeRepository {
  private static getClient() {
    const client = getSupabaseClient();
    if (!client) throw new Error('Database client not initialized. Please verify SUPABASE_URL and credentials.');
    return client;
  }

  public static async findAll(): Promise<College[]> {
    const { data, error } = await this.getClient()
      .from('colleges')
      .select('*')
      .order('name');
    if (error) throw new Error(`Failed to fetch colleges: ${error.message}`);
    return (data || []) as College[];
  }

  public static async findById(id: string): Promise<College | null> {
    const { data, error } = await this.getClient()
      .from('colleges')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw new Error(`Failed to fetch college by ID: ${error.message}`);
    return data as College | null;
  }

  public static async findByCode(code: string): Promise<College | null> {
    const trimmed = code.trim();
    const { data, error } = await this.getClient()
      .from('colleges')
      .select('*')
      .ilike('code', trimmed)
      .maybeSingle();
    if (error) throw new Error(`Failed to fetch college by code: ${error.message}`);
    return data as College | null;
  }

  public static async create(college: Partial<College>): Promise<College> {
    const { data, error } = await this.getClient()
      .from('colleges')
      .insert([college])
      .select('*')
      .single();
    if (error) throw new Error(`Failed to create college: ${error.message}`);
    return data as College;
  }

  public static async update(id: string, updates: Partial<College>): Promise<College> {
    const { data, error } = await this.getClient()
      .from('colleges')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw new Error(`Failed to update college: ${error.message}`);
    return data as College;
  }

  public static async delete(id: string): Promise<void> {
    const client = this.getClient();
    const college = await this.findById(id);
    if (!college) {
      const err: any = new Error('College not found.');
      err.statusCode = 404;
      err.code = 'NOT_FOUND';
      throw err;
    }

    // Check for dependent students
    const { count: studentCount } = await client
      .from('student_profiles')
      .select('id', { count: 'exact', head: true })
      .eq('college_id', id);

    if (studentCount && studentCount > 0) {
      const err: any = new Error(
        `Cannot delete college "${college.name}". It is associated with ${studentCount} registered student(s). Please reassign or deactivate the college instead.`
      );
      err.statusCode = 409;
      err.code = 'ACTIVE_RELATIONSHIP_EXISTS';
      throw err;
    }

    // Check for dependent drivers
    const { count: driverCount } = await client
      .from('driver_profiles')
      .select('id', { count: 'exact', head: true })
      .eq('college_id', id);

    if (driverCount && driverCount > 0) {
      const err: any = new Error(
        `Cannot delete college "${college.name}". It is associated with ${driverCount} driver(s). Please reassign or deactivate the college instead.`
      );
      err.statusCode = 409;
      err.code = 'ACTIVE_RELATIONSHIP_EXISTS';
      throw err;
    }

    // Check for dependent vehicles
    const { count: vehicleCount } = await client
      .from('vehicles')
      .select('id', { count: 'exact', head: true })
      .eq('college_id', id);

    if (vehicleCount && vehicleCount > 0) {
      const err: any = new Error(
        `Cannot delete college "${college.name}". It has ${vehicleCount} fleet vehicle(s) registered. Please reassign or deactivate the college instead.`
      );
      err.statusCode = 409;
      err.code = 'ACTIVE_RELATIONSHIP_EXISTS';
      throw err;
    }

    // Check for dependent routes
    const { count: routeCount } = await client
      .from('routes')
      .select('id', { count: 'exact', head: true })
      .eq('college_id', id);

    if (routeCount && routeCount > 0) {
      const err: any = new Error(
        `Cannot delete college "${college.name}". It has ${routeCount} transit route(s) configured. Please remove routes or deactivate the college instead.`
      );
      err.statusCode = 409;
      err.code = 'ACTIVE_RELATIONSHIP_EXISTS';
      throw err;
    }

    // Check for dependent pickup points
    const { count: pickupCount } = await client
      .from('pickup_points')
      .select('id', { count: 'exact', head: true })
      .eq('college_id', id);

    if (pickupCount && pickupCount > 0) {
      const err: any = new Error(
        `Cannot delete college "${college.name}". It has ${pickupCount} pickup point(s) assigned. Please remove pickup points or deactivate the college instead.`
      );
      err.statusCode = 409;
      err.code = 'ACTIVE_RELATIONSHIP_EXISTS';
      throw err;
    }

    const { error } = await client
      .from('colleges')
      .delete()
      .eq('id', id);

    if (error) throw new Error(`Delete college error: ${error.message}`);
  }
}
