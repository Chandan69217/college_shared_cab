import { TripRepository } from '../repositories/tripRepository';
import { getSupabaseClient } from '../database/supabaseClient';

export class TrackingService {
  /**
   * Updates driver live GPS coordinates during active trip in Supabase
   */
  public static async updateLocation(
    driverId: string,
    tripId: string,
    latitude: number,
    longitude: number,
    speed = 0,
    heading = 0
  ) {
    const trip = await TripRepository.findById(tripId);
    if (!trip) {
      const err: any = new Error('Trip not found.');
      err.statusCode = 404;
      err.code = 'TRIP_NOT_FOUND';
      throw err;
    }

    if (trip.driver_id !== driverId) {
      const err: any = new Error('Unauthorized driver.');
      err.statusCode = 403;
      err.code = 'UNAUTHORIZED';
      throw err;
    }

    const now = new Date().toISOString();
    await TripRepository.update(tripId, {
      live_latitude: latitude,
      live_longitude: longitude,
      last_gps_update: now,
    });

    // Save breadcrumb in Supabase
    const supabase = getSupabaseClient();
    if (supabase) {
      await supabase.from('vehicle_locations').insert([{
        vehicle_id: trip.vehicle_id,
        trip_id: tripId,
        driver_id: driverId,
        latitude,
        longitude,
        speed_kmh: speed,
        heading_deg: heading,
        recorded_at: now,
      }]).select().maybeSingle();
    }

    return {
      tripId,
      latitude,
      longitude,
      speed,
      heading,
      updatedAt: now,
    };
  }

  /**
   * Get vehicle live location for a trip from Supabase
   */
  public static async getTripLocation(tripId: string) {
    const trip = await TripRepository.findById(tripId);
    if (!trip) {
      const err: any = new Error('Trip not found.');
      err.statusCode = 404;
      err.code = 'TRIP_NOT_FOUND';
      throw err;
    }

    return {
      tripId,
      status: trip.status,
      liveLatitude: trip.live_latitude || 0.0,
      liveLongitude: trip.live_longitude || 0.0,
      lastGpsUpdate: trip.last_gps_update,
      vehicle: {
        number: trip.vehicle?.vehicle_number,
        model: trip.vehicle?.model,
        type: trip.vehicle?.type,
      },
      driver: {
        name: trip.driver?.full_name,
        phone: trip.driver?.phone,
      },
      route: {
        name: trip.route?.name,
        estimatedDurationMins: trip.route?.estimated_duration_mins,
      },
    };
  }

  /**
   * Get all active vehicles on map (for Admin monitoring) from Supabase
   */
  public static async getAllActiveVehicles() {
    const trips = await TripRepository.findAll();
    const activeTrips = trips.filter((t) => t.status === 'IN_PROGRESS' || t.status === 'SCHEDULED');

    return activeTrips.map((trip) => ({
      tripId: trip.id,
      tripStatus: trip.status,
      tripType: trip.trip_type,
      latitude: trip.live_latitude || 0.0,
      longitude: trip.live_longitude || 0.0,
      lastUpdated: trip.last_gps_update,
      bookedSeats: trip.booked_seats || 0,
      maxCapacity: trip.max_capacity || 6,
      vehicle: {
        id: trip.vehicle?.id,
        number: trip.vehicle?.vehicle_number,
        model: trip.vehicle?.model,
      },
      driver: {
        id: trip.driver?.id,
        name: trip.driver?.full_name || 'Assigned Driver',
        phone: trip.driver?.phone,
      },
      routeName: trip.route?.name,
    }));
  }
}
