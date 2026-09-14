import { db } from '../database/db';
import { Trip, TripPassenger } from '../types';

export class DriverService {
  /**
   * Get driver dashboard with active trip, assigned vehicle, today's trips
   */
  public static async getDriverDashboard(driverId: string) {
    const user = db.users.get(driverId);
    const profile = db.driverProfiles.get(driverId);
    const today = new Date().toISOString().split('T')[0];

    const todayTrips: Trip[] = [];
    let activeTrip: any = null;

    for (const trip of db.trips.values()) {
      if (trip.driver_id === driverId && trip.trip_date === today) {
        const route = db.routes.get(trip.route_id);
        const vehicle = db.vehicles.get(trip.vehicle_id);
        const hydratedTrip = { ...trip, route, vehicle };
        todayTrips.push(hydratedTrip);

        if (trip.status === 'IN_PROGRESS') {
          activeTrip = hydratedTrip;
        }
      }
    }

    // Default to first scheduled trip if none is in progress
    if (!activeTrip && todayTrips.length > 0) {
      activeTrip = todayTrips[0];
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
   * Get passengers manifest for a specific trip
   */
  public static async getTripManifest(tripId: string, driverId: string): Promise<TripPassenger[]> {
    const trip = db.trips.get(tripId);
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

    const passengers: TripPassenger[] = [];
    for (const p of db.tripPassengers.values()) {
      if (p.trip_id === tripId) {
        const student = db.users.get(p.student_id);
        const pickup = db.pickupPoints.get(p.pickup_point_id);
        passengers.push({
          ...p,
          student: student
            ? {
                id: student.id,
                full_name: student.full_name,
                phone: student.phone,
                email: student.email,
                role: student.role,
                status: student.status,
                password_hash: '',
                created_at: student.created_at,
                updated_at: student.updated_at,
              }
            : undefined,
          pickup_point: pickup,
        });
      }
    }

    return passengers;
  }

  /**
   * Start Trip
   */
  public static async startTrip(tripId: string, driverId: string): Promise<Trip> {
    const trip = db.trips.get(tripId);
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

    trip.status = 'IN_PROGRESS';
    trip.actual_start_time = new Date().toISOString();
    trip.updated_at = new Date().toISOString();
    db.trips.set(tripId, trip);

    return trip;
  }

  /**
   * End Trip
   */
  public static async endTrip(tripId: string, driverId: string): Promise<Trip> {
    const trip = db.trips.get(tripId);
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

    trip.status = 'COMPLETED';
    trip.actual_end_time = new Date().toISOString();
    trip.updated_at = new Date().toISOString();
    db.trips.set(tripId, trip);

    // Update unboarded passengers to NO_SHOW
    for (const [key, p] of db.tripPassengers.entries()) {
      if (p.trip_id === tripId && p.status === 'WAITING') {
        p.status = 'NO_SHOW';
        p.updated_at = new Date().toISOString();
        db.tripPassengers.set(key, p);
      }
    }

    return trip;
  }
}
