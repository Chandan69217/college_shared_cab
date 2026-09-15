import { Request, Response, NextFunction } from 'express';
import { MapsProvider } from '../integrations/mapsProvider';
import { sendSuccess, sendError } from '../utils/response';
import { CollegeRepository } from '../repositories/collegeRepository';
import { PickupPointRepository } from '../repositories/pickupPointRepository';
import { RouteRepository } from '../repositories/routeRepository';
import { VehicleRepository } from '../repositories/vehicleRepository';

export class CatalogController {
  // COLLEGES
  public static async getColleges(req: Request, res: Response, next: NextFunction) {
    try {
      const { code } = req.query;
      if (code && typeof code === 'string') {
        const college = await CollegeRepository.findByCode(code);
        return sendSuccess(res, 'College retrieved.', college ? [college] : []);
      }
      const colleges = await CollegeRepository.findAll();
      sendSuccess(res, 'Colleges retrieved.', colleges);
    } catch (err) {
      next(err);
    }
  }

  public static async lookupCollege(req: Request, res: Response, next: NextFunction) {
    try {
      const code = (req.query.code || req.params.code) as string;
      if (!code) {
        return sendError(res, 'College code parameter is required.', 'MISSING_PARAM', null, 400);
      }
      const college = await CollegeRepository.findByCode(code);
      if (!college) {
        return sendError(res, `No institution found with code "${code}".`, 'COLLEGE_NOT_FOUND', null, 404);
      }
      sendSuccess(res, 'College found.', college);
    } catch (err) {
      next(err);
    }
  }

  public static async createCollege(req: Request, res: Response, next: NextFunction) {
    try {
      const college = await CollegeRepository.create({
        name: req.body.name,
        code: req.body.code,
        address: req.body.address,
        latitude: req.body.latitude,
        longitude: req.body.longitude,
        service_radius_km: req.body.service_radius_km || 10.0,
        contact_email: req.body.contact_email,
        contact_phone: req.body.contact_phone,
        is_active: true,
      });
      sendSuccess(res, 'College created successfully.', college, 201);
    } catch (err) {
      next(err);
    }
  }

  public static async updateCollege(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.collegeId || req.params.id;
      const updated = await CollegeRepository.update(id, req.body);
      sendSuccess(res, 'College updated successfully.', updated);
    } catch (err) {
      next(err);
    }
  }

  public static async deleteCollege(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.collegeId || req.params.id;
      await CollegeRepository.delete(id);
      sendSuccess(res, 'College deleted successfully.');
    } catch (err) {
      next(err);
    }
  }

  // PICKUP POINTS
  public static async getPickupPoints(req: Request, res: Response, next: NextFunction) {
    try {
      const collegeId = req.query.college_id as string;
      const points = await PickupPointRepository.findAll(collegeId);
      sendSuccess(res, 'Pickup points retrieved.', points);
    } catch (err) {
      next(err);
    }
  }

  public static async createPickupPoint(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, landmark, address, latitude, longitude } = req.body;
      let collegeId = req.body.college_id;
      if (!collegeId) {
        const colleges = await CollegeRepository.findAll();
        if (colleges.length > 0) collegeId = colleges[0].id;
      }

      const college = await CollegeRepository.findById(collegeId);
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

      const pickup = await PickupPointRepository.create({
        college_id: collegeId,
        name,
        landmark,
        address,
        latitude,
        longitude,
        distance_to_college_km: distanceCheck.distanceKm,
        is_approved: distanceCheck.isValid,
        is_active: true,
      });

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

  public static async updatePickupPoint(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.pointId || req.params.pickupPointId || req.params.id;
      const updated = await PickupPointRepository.update(id, req.body);
      sendSuccess(res, 'Pickup point updated successfully.', updated);
    } catch (err) {
      next(err);
    }
  }

  public static async deletePickupPoint(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.pointId || req.params.pickupPointId || req.params.id;
      await PickupPointRepository.delete(id);
      sendSuccess(res, 'Pickup point deleted successfully.');
    } catch (err) {
      next(err);
    }
  }

  // ROUTES
  public static async getRoutes(req: Request, res: Response, next: NextFunction) {
    try {
      const collegeId = req.query.college_id as string;
      const routes = await RouteRepository.findAll(collegeId);
      sendSuccess(res, 'Routes retrieved.', routes);
    } catch (err) {
      next(err);
    }
  }

  public static async createRoute(req: Request, res: Response, next: NextFunction) {
    try {
      let collegeId = req.body.college_id;
      if (!collegeId) {
        const colleges = await CollegeRepository.findAll();
        if (colleges.length > 0) collegeId = colleges[0].id;
      }
      const route = await RouteRepository.create(
        {
          college_id: collegeId,
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
        },
        req.body.stops || []
      );
      sendSuccess(res, 'Route created successfully.', route, 201);
    } catch (err) {
      next(err);
    }
  }

  // VEHICLES
  public static async getVehicles(req: Request, res: Response, next: NextFunction) {
    try {
      const collegeId = req.query.college_id as string;
      const vehicles = await VehicleRepository.findAll(collegeId);
      sendSuccess(res, 'Vehicles retrieved.', vehicles);
    } catch (err) {
      next(err);
    }
  }

  public static async createVehicle(req: Request, res: Response, next: NextFunction) {
    try {
      let collegeId = req.body.college_id;
      if (!collegeId) {
        const colleges = await CollegeRepository.findAll();
        if (colleges.length > 0) collegeId = colleges[0].id;
      }
      const vehicle = await VehicleRepository.create({
        college_id: collegeId,
        vehicle_number: req.body.vehicle_number,
        model: req.body.model,
        type: req.body.type,
        seating_capacity: req.body.seating_capacity,
        registration_number: req.body.registration_number,
        insurance_validity: req.body.insurance_validity,
        fitness_validity: req.body.fitness_validity,
        status: req.body.status || 'ACTIVE',
      });
      sendSuccess(res, 'Vehicle registered successfully.', vehicle, 201);
    } catch (err) {
      next(err);
    }
  }
}
