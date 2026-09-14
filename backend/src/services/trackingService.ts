import { db } from '../database/db';

export class TrackingService {
  /**
   * Updates driver live GPS coordinates during active trip
   */
  public static async updateLocation(
    driverId: string,
    tripId: string,
    latitude: number,
    longitude: number,
    speed = 0,
    heading = 0
  ) {
    const trip = db.trips.get(tripId);
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
    trip.live_latitude = latitude;
    trip.live_longitude = longitude;
    trip.last_gps_update = now;
    db.trips.set(tripId, trip);

    // Save breadcrumb
    const locationEntry = {
      id: `loc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      vehicle_id: trip.vehicle_id,
      trip_id: tripId,
      driver_id: driverId,
      latitude,
      longitude,
      speed,
      heading,
      recorded_at: now,
    };
    db.vehicleLocations.push(locationEntry);

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
   * Get vehicle live location for a trip
   */
  public static async getTripLocation(tripId: string) {
    const trip = db.trips.get(tripId);
    if (!trip) {
      const err: any = new Error('Trip not found.');
      err.statusCode = 404;
      err.code = 'TRIP_NOT_FOUND';
      throw err;
    }

    const vehicle = db.vehicles.get(trip.vehicle_id);
    const driver = db.users.get(trip.driver_id);
    const route = db.routes.get(trip.route_id);

    return {
      tripId,
      status: trip.status,
      liveLatitude: trip.live_latitude || 28.5355,
      liveLongitude: trip.live_longitude || 77.391,
      lastGpsUpdate: trip.last_gps_update,
      vehicle: {
        number: vehicle?.vehicle_number,
        model: vehicle?.model,
        type: vehicle?.type,
      },
      driver: {
        name: driver?.full_name,
        phone: driver?.phone,
      },
      route: {
        name: route?.name,
        estimatedDurationMins: route?.estimated_duration_mins,
      },
    };
  }

  /**
   * Get all active vehicles on map (for Admin monitoring)
   */
  public static async getAllActiveVehicles() {
    const activeVehicles: any[] = [];
    for (const trip of db.trips.values()) {
      if (trip.status === 'IN_PROGRESS' || trip.status === 'SCHEDULED') {
        const vehicle = db.vehicles.get(trip.vehicle_id);
        const driver = db.users.get(trip.driver_id);
        const route = db.routes.get(trip.route_id);

        activeVehicles.push({
          tripId: trip.id,
          tripStatus: trip.status,
          tripType: trip.trip_type,
          latitude: trip.live_latitude || 28.5355,
          longitude: trip.live_longitude || 77.391,
          lastUpdated: trip.last_gps_update,
          bookedSeats: trip.booked_seats,
          maxCapacity: trip.max_capacity,
          vehicle: {
            id: vehicle?.id,
            number: vehicle?.vehicle_number,
            model: vehicle?.model,
          },
          driver: {
            id: driver?.id,
            name: driver?.full_name,
            phone: driver?.phone,
          },
          routeName: route?.name,
        });
      }
    }
    return activeVehicles;
  }
}
