import { Request, Response, NextFunction } from 'express';
import { MapsProvider } from '../integrations/mapsProvider';
import { sendSuccess, sendError } from '../utils/response';
import { CollegeRepository } from '../repositories/collegeRepository';
import { PickupPointRepository } from '../repositories/pickupPointRepository';
import { RouteRepository } from '../repositories/routeRepository';
import { VehicleRepository } from '../repositories/vehicleRepository';
import { UserRepository } from '../repositories/userRepository';
import { getSupabaseClient } from '../database/supabaseClient';

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
        sendError(res, `No institution found with code "${code}".`, 'COLLEGE_NOT_FOUND', null, 404);
        return;
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

      // If service_radius_km, latitude, or longitude changed, re-evaluate existing pickup points
      if (req.body.service_radius_km !== undefined || req.body.latitude !== undefined || req.body.longitude !== undefined) {
        const client = getSupabaseClient();
        if (client) {
          const { data: points } = await client.from('pickup_points').select('*').eq('college_id', id);
          if (points && points.length > 0) {
            for (const point of points) {
              const distanceCheck = MapsProvider.validatePickupWithinServiceRadius(
                updated.latitude,
                updated.longitude,
                point.latitude,
                point.longitude,
                updated.service_radius_km
              );
              await client.from('pickup_points').update({
                distance_to_college_km: distanceCheck.distanceKm,
                is_approved: distanceCheck.isValid,
                updated_at: new Date().toISOString(),
              }).eq('id', point.id);
            }
          }
        }
      }

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
      if (!collegeId || collegeId === '11111111-1111-1111-1111-111111111111') {
        const colleges = await CollegeRepository.findAll();
        if (colleges.length > 0) collegeId = colleges[0].id;
      } else {
        const existing = await CollegeRepository.findById(collegeId);
        if (!existing) {
          const colleges = await CollegeRepository.findAll();
          if (colleges.length > 0) collegeId = colleges[0].id;
        }
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
      const point = await PickupPointRepository.findById(id);
      if (!point) {
        sendError(res, 'Pickup point not found.', 'NOT_FOUND', null, 404);
        return;
      }

      const collegeId = req.body.college_id || point.college_id;
      const college = await CollegeRepository.findById(collegeId);

      const updates: any = { ...req.body };

      if (college) {
        const lat = req.body.latitude !== undefined ? req.body.latitude : point.latitude;
        const lng = req.body.longitude !== undefined ? req.body.longitude : point.longitude;
        const distanceCheck = MapsProvider.validatePickupWithinServiceRadius(
          college.latitude,
          college.longitude,
          lat,
          lng,
          college.service_radius_km
        );
        updates.distance_to_college_km = distanceCheck.distanceKm;
        if (req.body.is_approved === undefined) {
          updates.is_approved = distanceCheck.isValid;
        }
      }

      const updated = await PickupPointRepository.update(id, updates);
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
      let collegeId = (req.query.college_id || req.query.collegeId) as string;
      if (!collegeId && req.user) {
        if (req.user.role === 'STUDENT') {
          const profile = await UserRepository.getStudentProfile(req.user.userId);
          if (profile?.college_id) collegeId = profile.college_id;
        } else if (req.user.role === 'DRIVER') {
          const profile = await UserRepository.getDriverProfile(req.user.userId);
          if (profile?.college_id) collegeId = profile.college_id;
        }
      }
      const routes = await RouteRepository.findAll(collegeId);
      sendSuccess(res, 'Routes retrieved.', routes);
    } catch (err) {
      next(err);
    }
  }

  public static async getRouteMap(req: Request, res: Response, next: NextFunction) {
    try {
      const routeId = req.params.routeId || req.params.id;
      const route = await RouteRepository.findById(routeId);
      if (!route) {
        return sendError(res, 'Route not found.', 'ROUTE_NOT_FOUND', null, 404);
      }

      let college: any = null;
      if (route.college_id) {
        college = await CollegeRepository.findById(route.college_id);
      }

      const stops = (route.stops || []).map((s: any) => ({
        id: s.id,
        sequenceOrder: s.sequence_order,
        morningPickupTime: s.morning_pickup_time,
        eveningDropTime: s.evening_drop_time,
        pickupPoint: s.pickup_point ? {
          id: s.pickup_point.id,
          name: s.pickup_point.name,
          landmark: s.pickup_point.landmark,
          address: s.pickup_point.address,
          latitude: s.pickup_point.latitude,
          longitude: s.pickup_point.longitude,
          distanceToCollegeKm: s.pickup_point.distance_to_college_km,
        } : null,
      }));

      sendSuccess(res, 'Route map geometry retrieved.', {
        id: route.id,
        name: route.name,
        code: route.code,
        morningDepartureTime: route.morning_departure_time,
        eveningDepartureTime: route.evening_departure_time,
        estimatedDurationMins: route.estimated_duration_mins,
        college: college ? {
          id: college.id,
          name: college.name,
          latitude: college.latitude,
          longitude: college.longitude,
          serviceRadiusKm: college.service_radius_km,
        } : null,
        stops,
      });
    } catch (err) {
      next(err);
    }
  }

  public static async createRoute(req: Request, res: Response, next: NextFunction) {
    try {
      let collegeId = req.body.college_id;
      if (!collegeId || collegeId === '11111111-1111-1111-1111-111111111111') {
        const colleges = await CollegeRepository.findAll();
        if (colleges.length > 0) collegeId = colleges[0].id;
      } else {
        const existing = await CollegeRepository.findById(collegeId);
        if (!existing) {
          const colleges = await CollegeRepository.findAll();
          if (colleges.length > 0) collegeId = colleges[0].id;
        }
      }

      if (!collegeId) {
        return sendError(res, 'No active college found in system. Please register a college first.', 'COLLEGE_NOT_FOUND', null, 400);
      }

      // Sanitize optional default_vehicle_id
      let defaultVehicleId = req.body.default_vehicle_id || null;
      if (defaultVehicleId) {
        const veh = await VehicleRepository.findById(defaultVehicleId);
        if (!veh) defaultVehicleId = null;
      }

      // Sanitize optional default_driver_id
      let defaultDriverId = req.body.default_driver_id || null;
      if (defaultDriverId) {
        const client = RouteRepository['getClient'] ? RouteRepository['getClient']() : null;
        if (client) {
          const { data: driverUser } = await client
            .from('users')
            .select('id')
            .eq('id', defaultDriverId)
            .maybeSingle();
          if (!driverUser) defaultDriverId = null;
        }
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
          default_vehicle_id: defaultVehicleId,
          default_driver_id: defaultDriverId,
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
      if (!collegeId || collegeId === '11111111-1111-1111-1111-111111111111') {
        const colleges = await CollegeRepository.findAll();
        if (colleges.length > 0) collegeId = colleges[0].id;
      } else {
        const existing = await CollegeRepository.findById(collegeId);
        if (!existing) {
          const colleges = await CollegeRepository.findAll();
          if (colleges.length > 0) collegeId = colleges[0].id;
        }
      }

      if (!collegeId) {
        return sendError(res, 'No active college found in system. Please register a college first.', 'COLLEGE_NOT_FOUND', null, 400);
      }

      const defaultExpiry = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const vehicle = await VehicleRepository.create({
        college_id: collegeId,
        vehicle_number: req.body.vehicle_number,
        model: req.body.model,
        type: req.body.type,
        seating_capacity: req.body.seating_capacity,
        registration_number: req.body.registration_number || req.body.vehicle_number,
        insurance_validity: req.body.insurance_validity || defaultExpiry,
        fitness_validity: req.body.fitness_validity || defaultExpiry,
        status: req.body.status || 'ACTIVE',
      });
      sendSuccess(res, 'Vehicle registered successfully.', vehicle, 201);
    } catch (err) {
      next(err);
    }
  }
}
