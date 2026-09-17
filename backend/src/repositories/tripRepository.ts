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
      .select('*, route:routes(*, college:colleges(*)), vehicle:vehicles(*), driver:users!trips_driver_id_fkey(*)')
      .order('scheduled_departure_time');

    if (date) {
      query = query.eq('trip_date', date);
    }

    const { data, error } = await query;
    if (error) throw new Error(`Fetch trips error: ${error.message}`);
    return (data || []) as Trip[];
  }

  /**
   * Synchronize daily scheduled trips (both MORNING_PICKUP and EVENING_DROP) for all active routes on a given date.
   */
  public static async syncDailyTripsForDate(
    dateStr?: string,
    routeId?: string,
    driverId?: string
  ): Promise<void> {
    const todayIST = dateStr || new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());
    const client = this.getClient();

    let routeQuery = client
      .from('routes')
      .select('*, default_vehicle:vehicles(*)');

    if (routeId) {
      routeQuery = routeQuery.eq('id', routeId);
    } else if (driverId) {
      routeQuery = routeQuery.eq('default_driver_id', driverId);
    } else {
      routeQuery = routeQuery.eq('is_active', true);
    }

    const { data: routes, error: routeErr } = await routeQuery;
    if (routeErr || !routes || routes.length === 0) return;

    // 1. Fetch all existing trips for that date in ONE query
    const { data: existingTrips } = await client
      .from('trips')
      .select('id, route_id, trip_type, status, scheduled_departure_time, driver_id, vehicle_id, max_capacity')
      .eq('trip_date', todayIST);

    const tripMap = new Map<string, any>();
    if (existingTrips) {
      for (const t of existingTrips) {
        tripMap.set(`${t.route_id}_${t.trip_type}`, t);
      }
    }

    const newTripsToInsert: any[] = [];
    const updatePromises: PromiseLike<any>[] = [];

    for (const route of routes) {
      const vehicleCap = route.default_vehicle?.seating_capacity || route.max_capacity || 6;
      const driverIdToUse = route.default_driver_id || null;
      const vehicleIdToUse = route.default_vehicle_id || null;

      // 1. MORNING_PICKUP Trip
      if (route.morning_departure_time) {
        const existingMorning = tripMap.get(`${route.id}_MORNING_PICKUP`);

        if (!existingMorning) {
          newTripsToInsert.push({
            route_id: route.id,
            driver_id: driverIdToUse,
            vehicle_id: vehicleIdToUse,
            trip_date: todayIST,
            trip_type: 'MORNING_PICKUP',
            scheduled_departure_time: route.morning_departure_time,
            status: 'SCHEDULED',
            max_capacity: vehicleCap,
            booked_seats: 0,
            boarded_passengers: 0,
          });
        } else if (existingMorning.status === 'SCHEDULED') {
          const updates: any = {};
          if (existingMorning.scheduled_departure_time !== route.morning_departure_time) {
            updates.scheduled_departure_time = route.morning_departure_time;
          }
          if (existingMorning.driver_id !== driverIdToUse) {
            updates.driver_id = driverIdToUse;
          }
          if (existingMorning.vehicle_id !== vehicleIdToUse) {
            updates.vehicle_id = vehicleIdToUse;
          }
          if (existingMorning.max_capacity !== vehicleCap) {
            updates.max_capacity = vehicleCap;
          }
          if (Object.keys(updates).length > 0) {
            updates.updated_at = new Date().toISOString();
            updatePromises.push(client.from('trips').update(updates).eq('id', existingMorning.id));
          }
        }
      }

      // 2. EVENING_DROP Trip
      if (route.evening_departure_time) {
        const existingEvening = tripMap.get(`${route.id}_EVENING_DROP`);

        if (!existingEvening) {
          newTripsToInsert.push({
            route_id: route.id,
            driver_id: driverIdToUse,
            vehicle_id: vehicleIdToUse,
            trip_date: todayIST,
            trip_type: 'EVENING_DROP',
            scheduled_departure_time: route.evening_departure_time,
            status: 'SCHEDULED',
            max_capacity: vehicleCap,
            booked_seats: 0,
            boarded_passengers: 0,
          });
        } else if (existingEvening.status === 'SCHEDULED') {
          const updates: any = {};
          if (existingEvening.scheduled_departure_time !== route.evening_departure_time) {
            updates.scheduled_departure_time = route.evening_departure_time;
          }
          if (existingEvening.driver_id !== driverIdToUse) {
            updates.driver_id = driverIdToUse;
          }
          if (existingEvening.vehicle_id !== vehicleIdToUse) {
            updates.vehicle_id = vehicleIdToUse;
          }
          if (existingEvening.max_capacity !== vehicleCap) {
            updates.max_capacity = vehicleCap;
          }
          if (Object.keys(updates).length > 0) {
            updates.updated_at = new Date().toISOString();
            updatePromises.push(client.from('trips').update(updates).eq('id', existingEvening.id));
          }
        }
      }
    }
    if (newTripsToInsert.length > 0) {
      await client.from('trips').insert(newTripsToInsert);
    }
    if (updatePromises.length > 0) {
      await Promise.all(updatePromises);
    }
  }

  public static async findById(id: string): Promise<Trip | null> {
    const { data, error } = await this.getClient()
      .from('trips')
      .select('*, route:routes(*, college:colleges(*), route_pickup_points(*, pickup_point:pickup_points(*))), vehicle:vehicles(*), driver:users!trips_driver_id_fkey(*)')
      .eq('id', id)
      .maybeSingle();

    if (error) throw new Error(`Fetch trip by ID error: ${error.message}`);
    return data as Trip | null;
  }

  public static async findByDriverId(driverId: string, date: string): Promise<Trip[]> {
    const { data, error } = await this.getClient()
      .from('trips')
      .select('*, route:routes(*, college:colleges(*), route_pickup_points(*, pickup_point:pickup_points(*))), vehicle:vehicles(*)')
      .eq('driver_id', driverId)
      .eq('trip_date', date)
      .order('scheduled_departure_time');

    if (error) throw new Error(`Fetch driver trips error: ${error.message}`);
    return (data || []) as Trip[];
  }

  public static async findAssignedTrips(
    driverId: string,
    filter: 'TODAY' | 'UPCOMING' | 'COMPLETED' | 'ALL' = 'ALL'
  ): Promise<any[]> {
    const todayIST = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());
    let query = this.getClient()
      .from('trips')
      .select(`
        *,
        route:routes(
          *,
          college:colleges(*),
          route_pickup_points(
            *,
            pickup_point:pickup_points(*)
          )
        ),
        vehicle:vehicles(*),
        driver:users!trips_driver_id_fkey(*)
      `)
      .eq('driver_id', driverId);

    if (filter === 'TODAY') {
      query = query.eq('trip_date', todayIST).order('scheduled_departure_time', { ascending: true });
    } else if (filter === 'UPCOMING') {
      query = query.gt('trip_date', todayIST).order('trip_date', { ascending: true }).order('scheduled_departure_time', { ascending: true });
    } else if (filter === 'COMPLETED') {
      query = query.or(`status.eq.COMPLETED,trip_date.lt.${todayIST}`).order('trip_date', { ascending: false }).order('scheduled_departure_time', { ascending: false });
    } else {
      query = query.order('trip_date', { ascending: false }).order('scheduled_departure_time', { ascending: true });
    }

    const { data, error } = await query;
    if (error) throw new Error(`Fetch assigned driver trips error: ${error.message}`);

    const trips = data || [];

    // Fetch passenger counts and delay reports for these trips
    const tripIds = trips.map((t: any) => t.id);
    let delayMap: Record<string, any> = {};
    let passengerSummaryMap: Record<string, { booked: number; boarded: number; not_boarded: number; cancelled: number }> = {};

    if (tripIds.length > 0) {
      const { data: delays } = await this.getClient()
        .from('delay_reports')
        .select('*')
        .in('trip_id', tripIds)
        .order('reported_at', { ascending: false });

      (delays || []).forEach((d: any) => {
        if (!delayMap[d.trip_id]) delayMap[d.trip_id] = d;
      });

      const { data: passengers } = await this.getClient()
        .from('trip_passengers')
        .select('trip_id, status')
        .in('trip_id', tripIds);

      (passengers || []).forEach((p: any) => {
        if (!passengerSummaryMap[p.trip_id]) {
          passengerSummaryMap[p.trip_id] = { booked: 0, boarded: 0, not_boarded: 0, cancelled: 0 };
        }
        if (p.status === 'CANCELLED') {
          passengerSummaryMap[p.trip_id].cancelled += 1;
        } else {
          passengerSummaryMap[p.trip_id].booked += 1;
          if (p.status === 'BOARDED') {
            passengerSummaryMap[p.trip_id].boarded += 1;
          } else {
            passengerSummaryMap[p.trip_id].not_boarded += 1;
          }
        }
      });
    }

    return trips.map((trip: any) => {
      // Sort route stops ascending by sequence_order
      if (trip.route && trip.route.route_pickup_points) {
        trip.route.route_pickup_points.sort(
          (a: any, b: any) => (a.sequence_order || 0) - (b.sequence_order || 0)
        );
        trip.route.stops = trip.route.route_pickup_points.map((rpp: any) => ({
          id: rpp.id,
          sequence_order: rpp.sequence_order,
          sequenceOrder: rpp.sequence_order,
          morning_pickup_time: rpp.morning_pickup_time,
          morningPickupTime: rpp.morning_pickup_time,
          evening_drop_time: rpp.evening_drop_time,
          eveningDropTime: rpp.evening_drop_time,
          pickup_point: rpp.pickup_point,
          pickupPoint: rpp.pickup_point,
        }));
      }

      const summary = passengerSummaryMap[trip.id] || {
        booked: trip.booked_seats || 0,
        boarded: trip.boarded_passengers || 0,
        not_boarded: Math.max(0, (trip.booked_seats || 0) - (trip.boarded_passengers || 0)),
        cancelled: 0,
      };

      const delay = delayMap[trip.id] || null;
      const totalSeats = trip.max_capacity || trip.vehicle?.seating_capacity || 6;

      return {
        ...trip,
        current_stop_sequence: trip.current_stop_sequence || 0,
        currentStopSequence: trip.current_stop_sequence || 0,
        total_seats: totalSeats,
        totalSeats: totalSeats,
        booked_seats: summary.booked,
        bookedSeats: summary.booked,
        boarded_passengers: summary.boarded,
        boardedPassengers: summary.boarded,
        not_boarded_passengers: summary.not_boarded,
        notBoardedPassengers: summary.not_boarded,
        cancelled_passengers: summary.cancelled,
        cancelledPassengers: summary.cancelled,
        passenger_count: summary.booked,
        passengerCount: summary.booked,
        boarding_summary: {
          total_seats: totalSeats,
          booked: summary.booked,
          boarded: summary.boarded,
          not_boarded: summary.not_boarded,
          cancelled: summary.cancelled,
        },
        delay_info: delay,
        delayInfo: delay,
      };
    });
  }

  public static async findTripWithDetails(tripId: string, driverId?: string): Promise<any | null> {
    let query = this.getClient()
      .from('trips')
      .select(`
        *,
        route:routes(
          *,
          college:colleges(*),
          route_pickup_points(
            *,
            pickup_point:pickup_points(*)
          )
        ),
        vehicle:vehicles(*),
        driver:users!trips_driver_id_fkey(*)
      `)
      .eq('id', tripId);

    if (driverId) {
      query = query.eq('driver_id', driverId);
    }

    const { data, error } = await query.maybeSingle();
    if (error) throw new Error(`Fetch trip details error: ${error.message}`);
    if (!data) return null;

    const trip = data;
    if (trip.route && trip.route.route_pickup_points) {
      trip.route.route_pickup_points.sort(
        (a: any, b: any) => (a.sequence_order || 0) - (b.sequence_order || 0)
      );
      trip.route.stops = trip.route.route_pickup_points.map((rpp: any) => ({
        id: rpp.id,
        sequence_order: rpp.sequence_order,
        sequenceOrder: rpp.sequence_order,
        morning_pickup_time: rpp.morning_pickup_time,
        morningPickupTime: rpp.morning_pickup_time,
        evening_drop_time: rpp.evening_drop_time,
        eveningDropTime: rpp.evening_drop_time,
        pickup_point: rpp.pickup_point,
        pickupPoint: rpp.pickup_point,
      }));
    }

    const passengers = await this.getTripPassengers(tripId);
    const bookedCount = passengers.filter((p: any) => p.status !== 'CANCELLED').length;
    const boardedCount = passengers.filter((p: any) => p.status === 'BOARDED').length;
    const notBoardedCount = passengers.filter((p: any) => p.status === 'WAITING' || p.status === 'NO_SHOW').length;
    const cancelledCount = passengers.filter((p: any) => p.status === 'CANCELLED').length;
    const totalSeats = trip.max_capacity || trip.vehicle?.seating_capacity || 6;

    const { data: delay } = await this.getClient()
      .from('delay_reports')
      .select('*')
      .eq('trip_id', tripId)
      .order('reported_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    return {
      ...trip,
      current_stop_sequence: trip.current_stop_sequence || 0,
      currentStopSequence: trip.current_stop_sequence || 0,
      total_seats: totalSeats,
      totalSeats: totalSeats,
      booked_seats: bookedCount,
      bookedSeats: bookedCount,
      boarded_passengers: boardedCount,
      boardedPassengers: boardedCount,
      not_boarded_passengers: notBoardedCount,
      notBoardedPassengers: notBoardedCount,
      cancelled_passengers: cancelledCount,
      cancelledPassengers: cancelledCount,
      passenger_count: bookedCount,
      passengerCount: bookedCount,
      boarding_summary: {
        total_seats: totalSeats,
        booked: bookedCount,
        boarded: boardedCount,
        not_boarded: notBoardedCount,
        cancelled: cancelledCount,
      },
      passengers,
      delay_info: delay || null,
      delayInfo: delay || null,
    };
  }

  public static async getTripPassengers(tripId: string): Promise<TripPassenger[]> {
    const { data, error } = await this.getClient()
      .from('trip_passengers')
      .select(`
        *,
        student:users!trip_passengers_student_id_fkey(*),
        pickup_point:pickup_points!trip_passengers_pickup_point_id_fkey(*),
        drop_point:pickup_points!trip_passengers_drop_point_id_fkey(*)
      `)
      .eq('trip_id', tripId)
      .order('created_at', { ascending: true });

    if (error) throw new Error(`Fetch trip passengers error: ${error.message}`);

    // Resolve route stops to annotate sequence numbers
    const { data: tripData } = await this.getClient()
      .from('trips')
      .select('route_id, route:routes(*, college:colleges(*))')
      .eq('id', tripId)
      .maybeSingle();

    let stopSeqMap: Record<string, number> = {};
    if (tripData?.route_id) {
      const { data: routeStops } = await this.getClient()
        .from('route_pickup_points')
        .select('pickup_point_id, sequence_order')
        .eq('route_id', tripData.route_id);

      (routeStops || []).forEach((rs: any) => {
        stopSeqMap[rs.pickup_point_id] = rs.sequence_order;
      });
    }

    const studentIds = Array.from(new Set((data || []).map((p: any) => p.student_id).filter(Boolean)));
    let profileMap: Record<string, any> = {};
    if (studentIds.length > 0) {
      const { data: profiles } = await this.getClient()
        .from('student_profiles')
        .select('*')
        .in('id', studentIds);
      if (profiles) {
        profiles.forEach((p: any) => {
          profileMap[p.id] = p;
        });
      }
    }

    const routeObj: any = Array.isArray(tripData?.route) ? tripData?.route[0] : tripData?.route;
    const collegeName = routeObj?.college?.name || 'College Campus';

    const list = ((data || []) as any[]).map((p: any) => {
      const studentUser = p.student;
      const studentProfile = profileMap[p.student_id];
      const pickupSeq = stopSeqMap[p.pickup_point_id] ?? 1;
      const dropSeq = p.drop_point_id ? (stopSeqMap[p.drop_point_id] ?? 99) : 99;

      return {
        ...p,
        student_name: studentUser?.full_name || 'Student',
        student_phone: studentUser?.phone || '',
        student_email: studentUser?.email || '',
        student_id_number: studentProfile?.student_id_number || '',
        course: studentProfile?.course || '',
        roll_number: studentProfile?.roll_number || '',
        pickup_stop_sequence: pickupSeq,
        drop_stop_sequence: dropSeq,
        pickup_name: p.pickup_point?.name || 'Assigned Stop',
        pickup_address: p.pickup_point?.address || '',
        drop_name: p.drop_point?.name || collegeName,
        drop_address: p.drop_point?.address || collegeName,
      };
    }) as TripPassenger[];

    // Sort passengers primarily by pickup_stop_sequence ascending
    list.sort((a, b) => (a.pickup_stop_sequence || 0) - (b.pickup_stop_sequence || 0));

    return list;
  }

  public static async create(trip: Partial<Trip>): Promise<Trip> {
    const { data, error } = await this.getClient()
      .from('trips')
      .insert([trip])
      .select('*, route:routes(*, college:colleges(*)), vehicle:vehicles(*)')
      .single();

    if (error) throw new Error(`Create trip error: ${error.message}`);
    return data as Trip;
  }

  public static async update(id: string, updates: Partial<Trip>): Promise<Trip> {
    const { data, error } = await this.getClient()
      .from('trips')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*, route:routes(*, college:colleges(*)), vehicle:vehicles(*)')
      .single();

    if (error) throw new Error(`Update trip error: ${error.message}`);
    return data as Trip;
  }
}
