import { Trip, TripPassenger } from '../types';
import { UserRepository } from '../repositories/userRepository';
import { TripRepository } from '../repositories/tripRepository';

export class DriverService {
  /**
   * Get driver dashboard with active trip, assigned vehicle, today's trips
   */
  public static async getDriverDashboard(driverId: string) {
    const user = await UserRepository.findById(driverId);
    const profile = await UserRepository.getDriverProfile(driverId);
    const today = new Date().toISOString().split('T')[0];

    const todayTrips = await TripRepository.findByDriverId(driverId, today);
    let activeTrip: any = null;

    for (const trip of todayTrips) {
      if (trip.status === 'IN_PROGRESS') {
        activeTrip = trip;
        break;
      }
    }

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

    return TripRepository.update(tripId, {
      status: 'COMPLETED',
      actual_end_time: new Date().toISOString(),
    });
  }
}
