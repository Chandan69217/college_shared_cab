import { getSupabaseClient } from '../database/supabaseClient';
import { User, StudentProfile, DriverProfile, AdminProfile, VerificationStatus } from '../types';

export class UserRepository {
  private static getClient() {
    const client = getSupabaseClient();
    if (!client) throw new Error('Database client not initialized. Please verify SUPABASE_URL and credentials.');
    return client;
  }

  public static async findByEmailOrPhone(emailOrPhone: string): Promise<User | null> {
    const trimmed = emailOrPhone.trim().toLowerCase();
    const { data, error } = await this.getClient()
      .from('users')
      .select('*')
      .or(`email.eq.${trimmed},phone.eq.${emailOrPhone.trim()}`)
      .maybeSingle();

    if (error) throw new Error(`User lookup error: ${error.message}`);
    return data as User | null;
  }

  public static async findById(id: string): Promise<User | null> {
    const { data, error } = await this.getClient()
      .from('users')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw new Error(`User lookup error: ${error.message}`);
    return data as User | null;
  }

  public static async createUser(user: Partial<User>): Promise<User> {
    const { data, error } = await this.getClient()
      .from('users')
      .insert([user])
      .select('*')
      .single();

    if (error) throw new Error(`Create user error: ${error.message}`);
    return data as User;
  }

  public static async updateUser(id: string, updates: Partial<User>): Promise<User> {
    const { data, error } = await this.getClient()
      .from('users')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw new Error(`Update user error: ${error.message}`);
    return data as User;
  }

  public static async getStudentProfile(userId: string): Promise<StudentProfile | null> {
    const { data, error } = await this.getClient()
      .from('student_profiles')
      .select('*, college:colleges(*)')
      .eq('id', userId)
      .maybeSingle();

    if (error) throw new Error(`Student profile error: ${error.message}`);
    return data as StudentProfile | null;
  }

  public static async createStudentProfile(profile: Partial<StudentProfile>): Promise<StudentProfile> {
    const { data, error } = await this.getClient()
      .from('student_profiles')
      .insert([profile])
      .select('*')
      .single();

    if (error) throw new Error(`Create student profile error: ${error.message}`);
    return data as StudentProfile;
  }

  public static async updateStudentProfile(userId: string, updates: Partial<StudentProfile>): Promise<StudentProfile> {
    const { data, error } = await this.getClient()
      .from('student_profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select('*')
      .single();

    if (error) throw new Error(`Update student profile error: ${error.message}`);
    return data as StudentProfile;
  }

  public static async getDriverProfile(userId: string): Promise<DriverProfile | null> {
    const { data, error } = await this.getClient()
      .from('driver_profiles')
      .select('*, college:colleges(*)')
      .eq('id', userId)
      .maybeSingle();

    if (error) throw new Error(`Driver profile error: ${error.message}`);
    return data as DriverProfile | null;
  }

  public static async createDriverProfile(profile: Partial<DriverProfile>): Promise<DriverProfile> {
    const { data, error } = await this.getClient()
      .from('driver_profiles')
      .insert([profile])
      .select('*')
      .single();

    if (error) throw new Error(`Create driver profile error: ${error.message}`);
    return data as DriverProfile;
  }

  public static async updateDriverProfile(userId: string, updates: Partial<DriverProfile>): Promise<DriverProfile> {
    const { data, error } = await this.getClient()
      .from('driver_profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select('*')
      .single();

    if (error) throw new Error(`Update driver profile error: ${error.message}`);
    return data as DriverProfile;
  }

  public static async getAdminProfile(userId: string): Promise<AdminProfile | null> {
    const { data, error } = await this.getClient()
      .from('admin_profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) throw new Error(`Admin profile error: ${error.message}`);
    return data as AdminProfile | null;
  }

  public static async createAdminProfile(profile: Partial<AdminProfile>): Promise<AdminProfile> {
    const { data, error } = await this.getClient()
      .from('admin_profiles')
      .insert([profile])
      .select('*')
      .single();

    if (error) throw new Error(`Create admin profile error: ${error.message}`);
    return data as AdminProfile;
  }

  public static async updateAdminProfile(userId: string, updates: Partial<AdminProfile>): Promise<AdminProfile> {
    const { data, error } = await this.getClient()
      .from('admin_profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select('*')
      .single();

    if (error) throw new Error(`Update admin profile error: ${error.message}`);
    return data as AdminProfile;
  }

  public static async upsertAdminProfile(profile: Partial<AdminProfile>): Promise<AdminProfile> {
    const { data, error } = await this.getClient()
      .from('admin_profiles')
      .upsert({ ...profile, updated_at: new Date().toISOString() })
      .select('*')
      .single();

    if (error) throw new Error(`Upsert admin profile error: ${error.message}`);
    return data as AdminProfile;
  }

  public static async getAllAdmins(): Promise<any[]> {
    const { data, error } = await this.getClient()
      .from('admin_profiles')
      .select('*, user:users!admin_profiles_id_fkey(*)');

    if (error) throw new Error(`Fetch admins error: ${error.message}`);
    return (data || []).map((p: any) => ({
      ...p.user,
      profile: p,
    }));
  }

  public static async getAllStudents(collegeId?: string): Promise<any[]> {
    let query = this.getClient()
      .from('student_profiles')
      .select('*, user:users!student_profiles_id_fkey(*), college:colleges(*)')
      .order('created_at', { ascending: false });
    if (collegeId) {
      query = query.eq('college_id', collegeId);
    }
    const { data, error } = await query;
    if (error) throw new Error(`Fetch students error: ${error.message}`);
    return (data || []).map((p: any) => ({
      ...p.user,
      profile: p,
      college: p.college,
    }));
  }

  public static async getAllDrivers(collegeId?: string): Promise<any[]> {
    let query = this.getClient()
      .from('driver_profiles')
      .select('*, user:users!driver_profiles_id_fkey(*), college:colleges(*)')
      .order('created_at', { ascending: false });
    if (collegeId) {
      query = query.eq('college_id', collegeId);
    }
    const { data, error } = await query;
    if (error) throw new Error(`Fetch drivers error: ${error.message}`);
    return (data || []).map((p: any) => ({
      ...p.user,
      profile: p,
      college: p.college,
    }));
  }

  public static async deleteStudent(userId: string): Promise<void> {
    const client = this.getClient();

    // Check active bookings
    const { data: bookings } = await client
      .from('bookings')
      .select('id')
      .eq('student_id', userId)
      .eq('status', 'CONFIRMED');

    if (bookings && bookings.length > 0) {
      const err: any = new Error(
        `Cannot delete student: ${bookings.length} active confirmed booking(s) exist. Please cancel bookings or deactivate the account instead.`
      );
      err.statusCode = 409;
      err.code = 'ACTIVE_RELATIONSHIP_EXISTS';
      throw err;
    }

    // Check active subscriptions
    const { data: subs } = await client
      .from('subscriptions')
      .select('id')
      .eq('student_id', userId)
      .eq('status', 'ACTIVE');

    if (subs && subs.length > 0) {
      const err: any = new Error(
        'Cannot delete student with active subscription. Please expire or cancel the subscription first, or deactivate the user.'
      );
      err.statusCode = 409;
      err.code = 'ACTIVE_RELATIONSHIP_EXISTS';
      throw err;
    }

    // Safe delete cascade: student_profiles + users
    await client.from('student_profiles').delete().eq('id', userId);
    await client.from('users').delete().eq('id', userId);
  }

  public static async deleteDriver(userId: string): Promise<void> {
    const client = this.getClient();

    // Check assigned active routes
    const { data: routes } = await client
      .from('routes')
      .select('id, name')
      .eq('default_driver_id', userId)
      .eq('is_active', true);

    if (routes && routes.length > 0) {
      const err: any = new Error(
        `Cannot delete driver: Assigned as default driver for active route "${routes[0].name}". Please reassign the route first or update driver status to INACTIVE.`
      );
      err.statusCode = 409;
      err.code = 'ACTIVE_RELATIONSHIP_EXISTS';
      throw err;
    }

    // Check active scheduled trips
    const { data: trips } = await client
      .from('trips')
      .select('id, trip_date')
      .eq('driver_id', userId)
      .in('status', ['SCHEDULED', 'IN_PROGRESS']);

    if (trips && trips.length > 0) {
      const err: any = new Error(
        `Cannot delete driver: Driver has ${trips.length} active or scheduled trip(s). Reassign trips or change driver status to ON_LEAVE/INACTIVE instead.`
      );
      err.statusCode = 409;
      err.code = 'ACTIVE_RELATIONSHIP_EXISTS';
      throw err;
    }

    // Safe delete
    await client.from('driver_profiles').delete().eq('id', userId);
    await client.from('users').delete().eq('id', userId);
  }
}
