import { Request, Response, NextFunction } from 'express';
import { TrackingService } from '../services/trackingService';
import { DriverService } from '../services/driverService';
import { updateGpsLocationSchema } from '../validators/schemas';
import { sendSuccess } from '../utils/response';
import { TripRepository } from '../repositories/tripRepository';
import { VehicleRepository } from '../repositories/vehicleRepository';

export class TripController {
  public static async getTrips(req: Request, res: Response, next: NextFunction) {
    try {
      const date = req.query.date as string;
      const collegeId = req.query.college_id as string;
      const todayIST = date || new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());
      await TripRepository.syncDailyTripsForDate(todayIST);
      const trips = await TripRepository.findAll(collegeId, date);
      sendSuccess(res, 'Trips retrieved.', trips);
    } catch (err) {
      next(err);
    }
  }

  public static async createTrip(req: Request, res: Response, next: NextFunction) {
    try {
      const vehicle = await VehicleRepository.findById(req.body.vehicle_id);

      const trip = await TripRepository.create({
        route_id: req.body.route_id,
        vehicle_id: req.body.vehicle_id,
        driver_id: req.body.driver_id,
        trip_date: req.body.trip_date,
        trip_type: req.body.trip_type,
        scheduled_departure_time: req.body.scheduled_departure_time,
        status: 'SCHEDULED',
        max_capacity: req.body.max_capacity ? Number(req.body.max_capacity) : (vehicle?.seating_capacity || 6),
        booked_seats: 0,
        boarded_passengers: 0,
      });

      sendSuccess(res, 'Trip scheduled successfully.', trip, 201);
    } catch (err) {
      next(err);
    }
  }

  public static async startTrip(req: Request, res: Response, next: NextFunction) {
    try {
      const driverId = req.user!.userId;
      const tripId = req.params.tripId || req.params.id;
      const trip = await DriverService.startTrip(tripId, driverId);
      sendSuccess(res, 'Trip started successfully.', trip);
    } catch (err) {
      next(err);
    }
  }

  public static async endTrip(req: Request, res: Response, next: NextFunction) {
    try {
      const driverId = req.user!.userId;
      const tripId = req.params.tripId || req.params.id;
      const trip = await DriverService.endTrip(tripId, driverId);
      sendSuccess(res, 'Trip ended successfully.', trip);
    } catch (err) {
      next(err);
    }
  }

  public static async updateLocation(req: Request, res: Response, next: NextFunction) {
    try {
      const driverId = req.user!.userId;
      const tripId = req.params.tripId || req.params.id || req.body.trip_id;
      if (!tripId) {
        const err: any = new Error('Trip ID is required.');
        err.statusCode = 400;
        err.code = 'MISSING_TRIP_ID';
        throw err;
      }

      const validated = updateGpsLocationSchema.parse(req.body);
      const result = await TrackingService.updateLocation(
        driverId,
        tripId,
        validated.latitude,
        validated.longitude,
        validated.accuracy,
        validated.speed,
        validated.heading,
        validated.timestamp
      );
      sendSuccess(res, 'GPS location updated.', result);
    } catch (err) {
      next(err);
    }
  }

  public static async getTripLocation(req: Request, res: Response, next: NextFunction) {
    try {
      const tripId = req.params.tripId || req.params.id;
      const result = await TrackingService.getTripLocation(tripId);
      sendSuccess(res, 'Live vehicle location retrieved.', result);
    } catch (err) {
      next(err);
    }
  }

  public static async getAllActiveLocations(req: Request, res: Response, next: NextFunction) {
    try {
      const collegeId = req.query.college_id as string;
      const result = await TrackingService.getAllActiveVehicles(collegeId);
      sendSuccess(res, 'Active fleet locations retrieved.', result);
    } catch (err) {
      next(err);
    }
  }

  public static async getTripHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const tripId = req.params.tripId || req.params.id;
      const result = await TrackingService.getTripLocationHistory(tripId);
      sendSuccess(res, 'Trip location history retrieved.', result);
    } catch (err) {
      next(err);
    }
  }
}
