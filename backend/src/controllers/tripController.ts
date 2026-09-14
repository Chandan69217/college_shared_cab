import { Request, Response, NextFunction } from 'express';
import { db } from '../database/db';
import { TrackingService } from '../services/trackingService';
import { updateGpsLocationSchema } from '../validators/schemas';
import { sendSuccess } from '../utils/response';
import { Trip } from '../types';

export class TripController {
  public static async getTrips(req: Request, res: Response, next: NextFunction) {
    try {
      const date = req.query.date as string;
      let trips = Array.from(db.trips.values());
      if (date) {
        trips = trips.filter((t) => t.trip_date === date);
      }

      const hydrated = trips.map((t) => ({
        ...t,
        route: db.routes.get(t.route_id),
        vehicle: db.vehicles.get(t.vehicle_id),
        driver: db.users.get(t.driver_id),
      }));

      sendSuccess(res, 'Trips retrieved.', hydrated);
    } catch (err) {
      next(err);
    }
  }

  public static async createTrip(req: Request, res: Response, next: NextFunction) {
    try {
      const id = `trip-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const now = new Date().toISOString();
      const vehicle = db.vehicles.get(req.body.vehicle_id);

      const trip: Trip = {
        id,
        route_id: req.body.route_id,
        vehicle_id: req.body.vehicle_id,
        driver_id: req.body.driver_id,
        trip_date: req.body.trip_date,
        trip_type: req.body.trip_type,
        scheduled_departure_time: req.body.scheduled_departure_time,
        status: 'SCHEDULED',
        max_capacity: vehicle?.seating_capacity || 6,
        booked_seats: 0,
        boarded_passengers: 0,
        created_at: now,
        updated_at: now,
      };

      db.trips.set(id, trip);
      sendSuccess(res, 'Trip scheduled successfully.', trip, 201);
    } catch (err) {
      next(err);
    }
  }

  public static async updateLocation(req: Request, res: Response, next: NextFunction) {
    try {
      const driverId = req.user!.userId;
      const validated = updateGpsLocationSchema.parse(req.body);
      const result = await TrackingService.updateLocation(
        driverId,
        validated.trip_id,
        validated.latitude,
        validated.longitude,
        validated.speed,
        validated.heading
      );
      sendSuccess(res, 'GPS location updated.', result);
    } catch (err) {
      next(err);
    }
  }

  public static async getTripLocation(req: Request, res: Response, next: NextFunction) {
    try {
      const tripId = req.params.id;
      const result = await TrackingService.getTripLocation(tripId);
      sendSuccess(res, 'Live vehicle location retrieved.', result);
    } catch (err) {
      next(err);
    }
  }

  public static async getAllActiveLocations(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await TrackingService.getAllActiveVehicles();
      sendSuccess(res, 'Active fleet locations retrieved.', result);
    } catch (err) {
      next(err);
    }
  }
}
