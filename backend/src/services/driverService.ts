import { Trip, TripPassenger } from '../types';
import { UserRepository } from '../repositories/userRepository';
import { TripRepository } from '../repositories/tripRepository';
import { getSupabaseClient } from '../database/supabaseClient';
import { NotificationProvider } from '../integrations/notificationProvider';

export class DriverService {
  /**
   * Helper to get current date formatted in IST (Asia/Kolkata)
   */
  public static getTodayIST(): string {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());
  }

  /**
   * Get driver dashboard with active trip, assigned vehicle, today's trips
   */
  public static async getDriverDashboard(driverId: string) {
    const user = await UserRepository.findById(driverId);
    const profile = await UserRepository.getDriverProfile(driverId);
    const today = this.getTodayIST();
    const supabase = getSupabaseClient()!;

    // 1. Ensure today's trips (both MORNING_PICKUP and EVENING_DROP) are instantiated/synchronized
    await TripRepository.syncDailyTripsForDate(today, undefined, driverId);

    let todayTrips = await TripRepository.findAssignedTrips(driverId, 'TODAY');

    // Sort today's trips chronologically by scheduled_departure_time
    todayTrips.sort((a: any, b: any) =>
      (a.scheduled_departure_time || '00:00:00').localeCompare(b.scheduled_departure_time || '00:00:00')
    );

    let activeTrip: any = null;

    // 2. Priority 1: Any currently IN_PROGRESS trip for today
    for (const trip of todayTrips) {
      if (trip.status === 'IN_PROGRESS') {
        activeTrip = trip;
        break;
      }
    }

    // 3. Priority 2: Best matching SCHEDULED trip according to current IST time
    if (!activeTrip) {
      const scheduledTrips = todayTrips.filter((t: any) => t.status === 'SCHEDULED');
      if (scheduledTrips.length > 0) {
        const nowIST = new Intl.DateTimeFormat('en-GB', {
          timeZone: 'Asia/Kolkata',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        }).format(new Date());

        // Find the earliest upcoming scheduled trip whose time is >= nowIST
        const upcoming = scheduledTrips.find(
          (t: any) => (t.scheduled_departure_time || '00:00:00') >= nowIST
        );
        activeTrip = upcoming || scheduledTrips[0];
      }
    }

    // 4. Fallback: If all today's trips are COMPLETED, show the latest completed trip
    if (!activeTrip && todayTrips.length > 0) {
      activeTrip = todayTrips[todayTrips.length - 1];
    }

    // 5. Global fallback: Any other IN_PROGRESS trip for this driver
    if (!activeTrip) {
      const { data: inProgressTrips } = await supabase
        .from('trips')
        .select('id')
        .eq('driver_id', driverId)
        .eq('status', 'IN_PROGRESS')
        .limit(1);

      if (inProgressTrips && inProgressTrips.length > 0) {
        activeTrip = await TripRepository.findTripWithDetails(inProgressTrips[0].id, driverId);
      }
    }

    return {
      driver: {
        id: user?.id,
        full_name: user?.full_name,
        phone: user?.phone,
        email: user?.email,
      },
      profile,
      activeTrip,
      todayTrips,
      totalTripsToday: todayTrips.length,
    };
  }

  /**
   * Get all scheduled trips for driver with tab filtering (TODAY, UPCOMING, COMPLETED, ALL)
   */
  public static async getScheduledTrips(
    driverId: string,
    filter: string = 'ALL'
  ) {
    const today = this.getTodayIST();

    // Auto-sync today's morning and evening trips for all assigned routes
    await TripRepository.syncDailyTripsForDate(today, undefined, driverId);

    const filterUpper = (filter || 'ALL').toUpperCase() as 'TODAY' | 'UPCOMING' | 'COMPLETED' | 'ALL';
    const trips = await TripRepository.findAssignedTrips(driverId, filterUpper);

    // Grouping stats
    const allTrips = filterUpper === 'ALL' ? trips : await TripRepository.findAssignedTrips(driverId, 'ALL');
    const todayCount = allTrips.filter((t) => t.trip_date === today).length;
    const upcomingCount = allTrips.filter((t) => t.trip_date > today && t.status !== 'COMPLETED').length;
    const completedCount = allTrips.filter((t) => t.status === 'COMPLETED' || t.trip_date < today).length;

    return {
      trips,
      count: trips.length,
      filter: filterUpper,
      todayDate: today,
      stats: {
        today: todayCount,
        upcoming: upcomingCount,
        completed: completedCount,
        total: allTrips.length,
      },
    };
  }

  /**
   * Get full details for a single trip
   */
  public static async getTripDetails(tripId: string, driverId: string) {
    const trip = await TripRepository.findTripWithDetails(tripId, driverId);
    if (!trip) {
      const err: any = new Error('Trip not found or driver unauthorized.');
      err.statusCode = 404;
      err.code = 'TRIP_NOT_FOUND';
      throw err;
    }
    return trip;
  }

  /**
   * Get passengers manifest for a specific trip
   */
  public static async getTripManifest(tripId: string, driverId: string): Promise<TripPassenger[]> {
    const trip = await TripRepository.findById(tripId);
    if (!trip) {
      const err: any = new Error('Trip not found.');
      err.statusCode = 404;
      err.code = 'TRIP_NOT_FOUND';
      throw err;
    }

    if (trip.driver_id !== driverId) {
      const err: any = new Error('Driver is not assigned to this trip.');
      err.statusCode = 403;
      err.code = 'UNAUTHORIZED_DRIVER';
      throw err;
    }

    return TripRepository.getTripPassengers(tripId);
  }

  /**
   * Start Trip
   */
  public static async startTrip(tripId: string, driverId: string): Promise<Trip> {
    const trip = await TripRepository.findById(tripId);
    if (!trip) {
      const err: any = new Error('Trip not found.');
      err.statusCode = 404;
      err.code = 'TRIP_NOT_FOUND';
      throw err;
    }

    if (trip.driver_id !== driverId) {
      const err: any = new Error('Driver is not assigned to this trip.');
      err.statusCode = 403;
      err.code = 'UNAUTHORIZED_DRIVER';
      throw err;
    }

    return TripRepository.update(tripId, {
      status: 'IN_PROGRESS',
      actual_start_time: new Date().toISOString(),
    });
  }

  /**
   * End Trip
   */
  public static async endTrip(tripId: string, driverId: string): Promise<Trip> {
    const trip = await TripRepository.findById(tripId);
    if (!trip) {
      const err: any = new Error('Trip not found.');
      err.statusCode = 404;
      err.code = 'TRIP_NOT_FOUND';
      throw err;
    }

    if (trip.driver_id !== driverId) {
      const err: any = new Error('Driver is not assigned to this trip.');
      err.statusCode = 403;
      err.code = 'UNAUTHORIZED_DRIVER';
      throw err;
    }

    const now = new Date().toISOString();
    const supabase = getSupabaseClient();

    if (supabase) {
      // 1. Mark any remaining unboarded 'WAITING' passengers as 'NO_SHOW'
      await supabase
        .from('trip_passengers')
        .update({ status: 'NO_SHOW', updated_at: now })
        .eq('trip_id', tripId)
        .eq('status', 'WAITING');

      // 2. Mark any unboarded passes as EXPIRED
      await supabase
        .from('daily_travel_passes')
        .update({ status: 'EXPIRED', updated_at: now })
        .eq('trip_id', tripId)
        .eq('status', 'ACTIVE');
    }

    return TripRepository.update(tripId, {
      status: 'COMPLETED',
      actual_end_time: now,
    });
  }

  /**
   * Report delay on active trip and broadcast alert to booked students
   */
  public static async reportDelay(
    tripId: string,
    driverId: string,
    data: {
      delayMinutes: number;
      reason: string;
      currentStopId?: string;
      notes?: string;
    }
  ) {
    const trip = await TripRepository.findById(tripId);
    if (!trip) {
      const err: any = new Error('Trip not found.');
      err.statusCode = 404;
      err.code = 'TRIP_NOT_FOUND';
      throw err;
    }

    if (trip.driver_id !== driverId) {
      const err: any = new Error('Driver is not assigned to this trip.');
      err.statusCode = 403;
      err.code = 'UNAUTHORIZED_DRIVER';
      throw err;
    }

    const supabase = getSupabaseClient()!;
    const now = new Date().toISOString();

    // 1. Record delay in delay_reports
    const { data: delayReport, error } = await supabase
      .from('delay_reports')
      .insert([{
        trip_id: tripId,
        driver_id: driverId,
        delay_minutes: data.delayMinutes || 15,
        reason: data.reason || 'TRAFFIC',
        current_stop_id: data.currentStopId,
        notes: data.notes || '',
        reported_at: now,
      }])
      .select('*')
      .single();

    if (error) throw new Error(`Record delay error: ${error.message}`);

    // 2. Delay recorded in delay_reports (trip remains SCHEDULED or IN_PROGRESS)

    // 3. Notify all booked passengers
    const passengers = await TripRepository.getTripPassengers(tripId);
    for (const p of passengers) {
      if (p.student_id) {
        await NotificationProvider.send(
          p.student_id,
          'Trip Delay Notice',
          `Your vehicle on Route "${trip.route?.name || 'Assigned Route'}" is delayed by approx ${data.delayMinutes || 15} mins. Reason: ${data.reason}`,
          'TRIP',
          { tripId, delayMinutes: data.delayMinutes, reason: data.reason }
        );
      }
    }

    return delayReport;
  }

  /**
   * Update individual passenger manifest status (e.g. NO_SHOW, CANCELLED, BOARDED)
   */
  public static async updatePassengerStatus(
    tripId: string,
    driverId: string,
    studentId: string,
    status: 'WAITING' | 'BOARDED' | 'NO_SHOW' | 'CANCELLED',
    notes?: string
  ) {
    const trip = await TripRepository.findById(tripId);
    if (!trip) {
      const err: any = new Error('Trip not found.');
      err.statusCode = 404;
      err.code = 'TRIP_NOT_FOUND';
      throw err;
    }

    if (trip.driver_id !== driverId) {
      const err: any = new Error('Driver is not assigned to this trip.');
      err.statusCode = 403;
      err.code = 'UNAUTHORIZED_DRIVER';
      throw err;
    }

    const supabase = getSupabaseClient()!;
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from('trip_passengers')
      .update({
        status,
        verified_by_driver_id: driverId,
        updated_at: now,
      })
      .eq('trip_id', tripId)
      .eq('student_id', studentId)
      .select('*')
      .single();

    if (error) throw new Error(`Update passenger status error: ${error.message}`);

    // If marked BOARDED, update boarded count
    if (status === 'BOARDED') {
      await TripRepository.update(tripId, {
        boarded_passengers: (trip.boarded_passengers || 0) + 1,
      });
    }

    return data;
  }
}
