import { getSupabaseClient } from '../database/supabaseClient';
import { Trip, TripPassenger } from '../types';

export class TripRepository {
  private static getClient() {
    const client = getSupabaseClient();
    if (!client) throw new Error('Database client not initialized. Please verify SUPABASE_URL and credentials.');
    return client;
  }

  public static async findAll(collegeId?: string, date?: string): Promise<Trip[]> {
    let query = this.getClient()
      .from('trips')
      .select('*, route:routes(*), vehicle:vehicles(*), driver:users(*)')
      .order('scheduled_departure_time');

    if (date) {
      query = query.eq('trip_date', date);
    }

    const { data, error } = await query;
    if (error) throw new Error(`Fetch trips error: ${error.message}`);
    return (data || []) as Trip[];
  }

  public static async findById(id: string): Promise<Trip | null> {
    const { data, error } = await this.getClient()
      .from('trips')
      .select('*, route:routes(*, route_pickup_points(*, pickup_point:pickup_points(*))), vehicle:vehicles(*), driver:users(*)')
      .eq('id', id)
      .maybeSingle();

    if (error) throw new Error(`Fetch trip by ID error: ${error.message}`);
    return data as Trip | null;
  }

  public static async findByDriverId(driverId: string, date: string): Promise<Trip[]> {
    const { data, error } = await this.getClient()
      .from('trips')
      .select('*, route:routes(*, route_pickup_points(*, pickup_point:pickup_points(*))), vehicle:vehicles(*)')
      .eq('driver_id', driverId)
      .eq('trip_date', date)
      .order('scheduled_departure_time');

    if (error) throw new Error(`Fetch driver trips error: ${error.message}`);
    return (data || []) as Trip[];
  }

  public static async getTripPassengers(tripId: string): Promise<TripPassenger[]> {
    const { data, error } = await this.getClient()
      .from('trip_passengers')
      .select('*, student:users(*), pickup_point:pickup_points(*)')
      .eq('trip_id', tripId);

    if (error) throw new Error(`Fetch trip passengers error: ${error.message}`);
    return (data || []) as TripPassenger[];
  }

  public static async create(trip: Partial<Trip>): Promise<Trip> {
    const { data, error } = await this.getClient()
      .from('trips')
      .insert([trip])
      .select('*, route:routes(*), vehicle:vehicles(*)')
      .single();

    if (error) throw new Error(`Create trip error: ${error.message}`);
    return data as Trip;
  }

  public static async update(id: string, updates: Partial<Trip>): Promise<Trip> {
    const { data, error } = await this.getClient()
      .from('trips')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*, route:routes(*), vehicle:vehicles(*)')
      .single();

    if (error) throw new Error(`Update trip error: ${error.message}`);
    return data as Trip;
  }
}
