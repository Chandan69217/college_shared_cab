import { getSupabaseClient } from '../database/supabaseClient';
import { Booking, DailyTravelPass } from '../types';

export class BookingRepository {
  private static getClient() {
    const client = getSupabaseClient();
    if (!client) throw new Error('Database client not initialized. Please verify SUPABASE_URL and credentials.');
    return client;
  }

  public static async findAll(date?: string): Promise<Booking[]> {
    let query = this.getClient()
      .from('bookings')
      .select('*, trip:trips(*, route:routes(*, college:colleges(*)), vehicle:vehicles(*), driver:users!trips_driver_id_fkey(*)), route:routes(*, college:colleges(*)), pickup_point:pickup_points!bookings_pickup_point_id_fkey(*), drop_point:pickup_points!bookings_drop_point_id_fkey(*), student:users!bookings_student_id_fkey(*)')
      .order('created_at', { ascending: false });

    if (date) {
      query = query.eq('booking_date', date);
    }

    const { data, error } = await query;
    if (error) throw new Error(`Fetch bookings error: ${error.message}`);
    
    // Fetch student profiles for student IDs
    const studentIds = Array.from(new Set((data || []).map((b: any) => b.student_id).filter(Boolean)));
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

    return ((data || []) as any[]).map((b: any) => {
      const studentUser = b.student;
      const studentProfile = profileMap[b.student_id];
      return {
        ...b,
        student_name: studentUser?.full_name || 'N/A',
        student_email: studentUser?.email || 'N/A',
        student_phone: studentUser?.phone || 'N/A',
        student_id_number: studentProfile?.student_id_number || 'N/A',
        student_course: studentProfile?.course || 'N/A',
        college_name: studentProfile?.college?.name || b.route?.college?.name || 'N/A',
        route_name: b.route?.name || 'N/A',
        pickup_name: b.pickup_point?.name || 'N/A',
        drop_name: b.drop_point?.name || b.route?.college?.name || 'College Campus',
      };
    }) as Booking[];
  }

  public static async findByStudentId(studentId: string): Promise<Booking[]> {
    const { data, error } = await this.getClient()
      .from('bookings')
      .select('*, trip:trips(*, route:routes(*, college:colleges(*)), vehicle:vehicles(*), driver:users!trips_driver_id_fkey(*)), route:routes(*, college:colleges(*)), pickup_point:pickup_points!bookings_pickup_point_id_fkey(*), drop_point:pickup_points!bookings_drop_point_id_fkey(*)')
      .eq('student_id', studentId)
      .order('booking_date', { ascending: false });

    if (error) throw new Error(`Fetch student bookings error: ${error.message}`);
    return (data || []) as Booking[];
  }

  public static async findTodayBooking(studentId: string, todayDate: string): Promise<Booking | null> {
    const { data, error } = await this.getClient()
      .from('bookings')
      .select('*, trip:trips(*, route:routes(*, college:colleges(*)), vehicle:vehicles(*), driver:users!trips_driver_id_fkey(*)), route:routes(*, college:colleges(*)), pickup_point:pickup_points!bookings_pickup_point_id_fkey(*), drop_point:pickup_points!bookings_drop_point_id_fkey(*)')
      .eq('student_id', studentId)
      .eq('booking_date', todayDate)
      .eq('status', 'CONFIRMED')
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) throw new Error(`Fetch today booking error: ${error.message}`);
    return (data && data.length > 0) ? (data[0] as Booking) : null;
  }

  public static async findDailyPass(bookingId: string): Promise<DailyTravelPass | null> {
    const { data, error } = await this.getClient()
      .from('daily_travel_passes')
      .select('*, trip:trips(*, route:routes(*, college:colleges(*)), vehicle:vehicles(*), driver:users!trips_driver_id_fkey(*)), pickup_point:pickup_points!daily_travel_passes_pickup_point_id_fkey(*), drop_point:pickup_points!daily_travel_passes_drop_point_id_fkey(*)')
      .eq('booking_id', bookingId)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) throw new Error(`Fetch daily pass error: ${error.message}`);
    return (data && data.length > 0) ? (data[0] as DailyTravelPass) : null;
  }

  public static async findActivePassByStudent(studentId: string): Promise<DailyTravelPass | null> {
    const { data, error } = await this.getClient()
      .from('daily_travel_passes')
      .select('*, trip:trips(*, route:routes(*, college:colleges(*)), vehicle:vehicles(*), driver:users!trips_driver_id_fkey(*)), pickup_point:pickup_points!daily_travel_passes_pickup_point_id_fkey(*), drop_point:pickup_points!daily_travel_passes_drop_point_id_fkey(*)')
      .eq('student_id', studentId)
      .in('status', ['ACTIVE', 'USED'])
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) throw new Error(`Fetch active pass error: ${error.message}`);
    return (data && data.length > 0) ? (data[0] as DailyTravelPass) : null;
  }

  public static async findPassByTokenHash(tokenHash: string): Promise<DailyTravelPass | null> {
    const { data, error } = await this.getClient()
      .from('daily_travel_passes')
      .select('*, trip:trips(*, route:routes(*, college:colleges(*)), vehicle:vehicles(*), driver:users!trips_driver_id_fkey(*)), pickup_point:pickup_points!daily_travel_passes_pickup_point_id_fkey(*), drop_point:pickup_points!daily_travel_passes_drop_point_id_fkey(*), student:users!daily_travel_passes_student_id_fkey(*)')
      .eq('auth_token_hash', tokenHash)
      .maybeSingle();

    if (error) throw new Error(`Pass token lookup error: ${error.message}`);
    return data as DailyTravelPass | null;
  }

  public static async updatePass(id: string, updates: Partial<DailyTravelPass>): Promise<DailyTravelPass> {
    const { data, error } = await this.getClient()
      .from('daily_travel_passes')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw new Error(`Update pass error: ${error.message}`);
    return data as DailyTravelPass;
  }

  public static async bookTripAtomic(
    studentId: string,
    subscriptionId: string,
    tripId: string,
    pickupPointId: string,
    tokenHash: string,
    validUntil: Date,
    dropPointId?: string
  ) {
    // Call Supabase RPC fn_book_trip_atomic
    const { data, error } = await this.getClient().rpc('fn_book_trip_atomic', {
      p_student_id: studentId,
      p_subscription_id: subscriptionId,
      p_trip_id: tripId,
      p_pickup_point_id: pickupPointId,
      p_auth_token_hash: tokenHash,
      p_pass_valid_until: validUntil.toISOString(),
      p_drop_point_id: dropPointId || null,
    });

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  public static async cancelBooking(bookingId: string, studentId: string): Promise<void> {
    const { error } = await this.getClient()
      .from('bookings')
      .update({ status: 'CANCELLED', updated_at: new Date().toISOString() })
      .eq('id', bookingId)
      .eq('student_id', studentId);

    if (error) throw new Error(`Cancel booking error: ${error.message}`);
  }
}
