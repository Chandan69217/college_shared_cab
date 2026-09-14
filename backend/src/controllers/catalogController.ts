import { Request, Response, NextFunction } from 'express';
import { db } from '../database/db';
import { MapsProvider } from '../integrations/mapsProvider';
import { sendSuccess, sendError } from '../utils/response';
import { College, PickupPoint, Route, Vehicle } from '../types';

export class CatalogController {
  // COLLEGES
  public static async getColleges(req: Request, res: Response, next: NextFunction) {
    try {
      const colleges = Array.from(db.colleges.values());
      sendSuccess(res, 'Colleges retrieved.', colleges);
    } catch (err) {
      next(err);
    }
  }

  public static async createCollege(req: Request, res: Response, next: NextFunction) {
    try {
      const id = `col-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const now = new Date().toISOString();
      const college: College = {
        id,
        name: req.body.name,
        code: req.body.code,
        address: req.body.address,
        latitude: req.body.latitude,
        longitude: req.body.longitude,
        service_radius_km: req.body.service_radius_km || 10.0,
        contact_email: req.body.contact_email,
        contact_phone: req.body.contact_phone,
        is_active: true,
        created_at: now,
        updated_at: now,
      };
      db.colleges.set(id, college);
      sendSuccess(res, 'College created successfully.', college, 201);
    } catch (err) {
      next(err);
    }
  }

  // PICKUP POINTS
  public static async getPickupPoints(req: Request, res: Response, next: NextFunction) {
    try {
      const collegeId = req.query.college_id as string;
      let points = Array.from(db.pickupPoints.values());
      if (collegeId) {
        points = points.filter((p) => p.college_id === collegeId);
      }
      sendSuccess(res, 'Pickup points retrieved.', points);
    } catch (err) {
      next(err);
    }
  }

  public static async createPickupPoint(req: Request, res: Response, next: NextFunction) {
    try {
      const { college_id, name, landmark, address, latitude, longitude } = req.body;
      const college = db.colleges.get(college_id);
      if (!college) {
        sendError(res, 'College not found.', 'COLLEGE_NOT_FOUND', null, 404);
        return;
      }

      // Calculate distance to college
      const distanceCheck = MapsProvider.validatePickupWithinServiceRadius(
        college.latitude,
        college.longitude,
        latitude,
        longitude,
        college.service_radius_km
      );

      const id = `pk-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const now = new Date().toISOString();

      const pickup: PickupPoint = {
        id,
        college_id,
        name,
        landmark,
        address,
        latitude,
        longitude,
        distance_to_college_km: distanceCheck.distanceKm,
        is_approved: distanceCheck.isValid, // Auto approve if within radius, require admin manual approve if outside
        is_active: true,
        created_at: now,
        updated_at: now,
      };

      db.pickupPoints.set(id, pickup);

      if (!distanceCheck.isValid) {
        sendSuccess(
          res,
          `Pickup created, but distance (${distanceCheck.distanceKm} km) exceeds the ${college.service_radius_km} km service area. Marked for manual approval.`,
          pickup,
          201
        );
        return;
      }

      sendSuccess(res, 'Pickup point created within service area.', pickup, 201);
    } catch (err) {
      next(err);
    }
  }

  // ROUTES
  public static async getRoutes(req: Request, res: Response, next: NextFunction) {
    try {
      const routes = Array.from(db.routes.values());
      sendSuccess(res, 'Routes retrieved.', routes);
    } catch (err) {
      next(err);
    }
  }

  public static async createRoute(req: Request, res: Response, next: NextFunction) {
    try {
      const id = `rt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const now = new Date().toISOString();
      const route: Route = {
        id,
        college_id: req.body.college_id,
        name: req.body.name,
        code: req.body.code,
        description: req.body.description,
        morning_departure_time: req.body.morning_departure_time,
        evening_departure_time: req.body.evening_departure_time,
        estimated_duration_mins: req.body.estimated_duration_mins || 45,
        default_vehicle_id: req.body.default_vehicle_id,
        default_driver_id: req.body.default_driver_id,
        max_capacity: req.body.max_capacity || 6,
        is_active: true,
        stops: req.body.stops || [],
        created_at: now,
        updated_at: now,
      };
      db.routes.set(id, route);
      sendSuccess(res, 'Route created successfully.', route, 201);
    } catch (err) {
      next(err);
    }
  }

  // VEHICLES
  public static async getVehicles(req: Request, res: Response, next: NextFunction) {
    try {
      const vehicles = Array.from(db.vehicles.values());
      sendSuccess(res, 'Vehicles retrieved.', vehicles);
    } catch (err) {
      next(err);
    }
  }

  public static async createVehicle(req: Request, res: Response, next: NextFunction) {
    try {
      const id = `veh-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const now = new Date().toISOString();
      const vehicle: Vehicle = {
        id,
        college_id: req.body.college_id,
        vehicle_number: req.body.vehicle_number,
        model: req.body.model,
        type: req.body.type,
        seating_capacity: req.body.seating_capacity,
        registration_number: req.body.registration_number,
        insurance_validity: req.body.insurance_validity,
        fitness_validity: req.body.fitness_validity,
        status: req.body.status || 'ACTIVE',
        created_at: now,
        updated_at: now,
      };
      db.vehicles.set(id, vehicle);
      sendSuccess(res, 'Vehicle registered successfully.', vehicle, 201);
    } catch (err) {
      next(err);
    }
  }
}
