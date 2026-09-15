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
      .select('*, trip:trips(*), route:routes(*), pickup_point:pickup_points(*), student:users(*)')
      .order('created_at', { ascending: false });

    if (date) {
      query = query.eq('booking_date', date);
    }

    const { data, error } = await query;
    if (error) throw new Error(`Fetch bookings error: ${error.message}`);
    return (data || []) as Booking[];
  }

  public static async findByStudentId(studentId: string): Promise<Booking[]> {
    const { data, error } = await this.getClient()
      .from('bookings')
      .select('*, trip:trips(*), route:routes(*), pickup_point:pickup_points(*)')
      .eq('student_id', studentId)
      .order('booking_date', { ascending: false });

    if (error) throw new Error(`Fetch student bookings error: ${error.message}`);
    return (data || []) as Booking[];
  }

  public static async findTodayBooking(studentId: string, todayDate: string): Promise<Booking | null> {
    const { data, error } = await this.getClient()
      .from('bookings')
      .select('*, trip:trips(*, vehicle:vehicles(*), driver:users(*)), route:routes(*), pickup_point:pickup_points(*)')
      .eq('student_id', studentId)
      .eq('booking_date', todayDate)
      .eq('status', 'CONFIRMED')
      .maybeSingle();

    if (error) throw new Error(`Fetch today booking error: ${error.message}`);
    return data as Booking | null;
  }

  public static async findDailyPass(bookingId: string): Promise<DailyTravelPass | null> {
    const { data, error } = await this.getClient()
      .from('daily_travel_passes')
      .select('*, trip:trips(*), pickup_point:pickup_points(*)')
      .eq('booking_id', bookingId)
      .maybeSingle();

    if (error) throw new Error(`Fetch daily pass error: ${error.message}`);
    return data as DailyTravelPass | null;
  }

  public static async findActivePassByStudent(studentId: string): Promise<DailyTravelPass | null> {
    const { data, error } = await this.getClient()
      .from('daily_travel_passes')
      .select('*, trip:trips(*, route:routes(*), vehicle:vehicles(*), driver:users(*)), pickup_point:pickup_points(*)')
      .eq('student_id', studentId)
      .in('status', ['ACTIVE', 'USED'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw new Error(`Fetch active pass error: ${error.message}`);
    return data as DailyTravelPass | null;
  }

  public static async findPassByTokenHash(tokenHash: string): Promise<DailyTravelPass | null> {
    const { data, error } = await this.getClient()
      .from('daily_travel_passes')
      .select('*, trip:trips(*), pickup_point:pickup_points(*), student:users(*)')
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
    tripId: string,
    pickupPointId: string,
    tokenHash: string,
    validUntil: Date
  ) {
    // Call Supabase RPC fn_book_trip_atomic
    const { data, error } = await this.getClient().rpc('fn_book_trip_atomic', {
      p_student_id: studentId,
      p_trip_id: tripId,
      p_pickup_point_id: pickupPointId,
      p_auth_token_hash: tokenHash,
      p_pass_valid_until: validUntil.toISOString(),
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
