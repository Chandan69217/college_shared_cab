"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CatalogController = void 0;
const mapsProvider_1 = require("../integrations/mapsProvider");
const response_1 = require("../utils/response");
const collegeRepository_1 = require("../repositories/collegeRepository");
const pickupPointRepository_1 = require("../repositories/pickupPointRepository");
const routeRepository_1 = require("../repositories/routeRepository");
const vehicleRepository_1 = require("../repositories/vehicleRepository");
const userRepository_1 = require("../repositories/userRepository");
const supabaseClient_1 = require("../database/supabaseClient");
class CatalogController {
    // COLLEGES
    static async getColleges(req, res, next) {
        try {
            const { code } = req.query;
            if (code && typeof code === 'string') {
                const college = await collegeRepository_1.CollegeRepository.findByCode(code);
                return (0, response_1.sendSuccess)(res, 'College retrieved.', college ? [college] : []);
            }
            const colleges = await collegeRepository_1.CollegeRepository.findAll();
            (0, response_1.sendSuccess)(res, 'Colleges retrieved.', colleges);
        }
        catch (err) {
            next(err);
        }
    }
    static async lookupCollege(req, res, next) {
        try {
            const code = (req.query.code || req.params.code);
            if (!code) {
                return (0, response_1.sendError)(res, 'College code parameter is required.', 'MISSING_PARAM', null, 400);
            }
            const college = await collegeRepository_1.CollegeRepository.findByCode(code);
            if (!college) {
                (0, response_1.sendError)(res, `No institution found with code "${code}".`, 'COLLEGE_NOT_FOUND', null, 404);
                return;
            }
            (0, response_1.sendSuccess)(res, 'College found.', college);
        }
        catch (err) {
            next(err);
        }
    }
    static async createCollege(req, res, next) {
        try {
            const college = await collegeRepository_1.CollegeRepository.create({
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
            (0, response_1.sendSuccess)(res, 'College created successfully.', college, 201);
        }
        catch (err) {
            next(err);
        }
    }
    static async updateCollege(req, res, next) {
        try {
            const id = req.params.collegeId || req.params.id;
            const updated = await collegeRepository_1.CollegeRepository.update(id, req.body);
            // If service_radius_km, latitude, or longitude changed, re-evaluate existing pickup points
            if (req.body.service_radius_km !== undefined || req.body.latitude !== undefined || req.body.longitude !== undefined) {
                const client = (0, supabaseClient_1.getSupabaseClient)();
                if (client) {
                    const { data: points } = await client.from('pickup_points').select('*').eq('college_id', id);
                    if (points && points.length > 0) {
                        for (const point of points) {
                            const distanceCheck = mapsProvider_1.MapsProvider.validatePickupWithinServiceRadius(updated.latitude, updated.longitude, point.latitude, point.longitude, updated.service_radius_km);
                            await client.from('pickup_points').update({
                                distance_to_college_km: distanceCheck.distanceKm,
                                is_approved: distanceCheck.isValid,
                                updated_at: new Date().toISOString(),
                            }).eq('id', point.id);
                        }
                    }
                }
            }
            (0, response_1.sendSuccess)(res, 'College updated successfully.', updated);
        }
        catch (err) {
            next(err);
        }
    }
    static async deleteCollege(req, res, next) {
        try {
            const id = req.params.collegeId || req.params.id;
            await collegeRepository_1.CollegeRepository.delete(id);
            (0, response_1.sendSuccess)(res, 'College deleted successfully.');
        }
        catch (err) {
            next(err);
        }
    }
    // PICKUP POINTS
    static async getPickupPoints(req, res, next) {
        try {
            const collegeId = req.query.college_id;
            const points = await pickupPointRepository_1.PickupPointRepository.findAll(collegeId);
            (0, response_1.sendSuccess)(res, 'Pickup points retrieved.', points);
        }
        catch (err) {
            next(err);
        }
    }
    static async createPickupPoint(req, res, next) {
        try {
            const { name, landmark, address, latitude, longitude } = req.body;
            let collegeId = req.body.college_id;
            if (!collegeId || collegeId === '11111111-1111-1111-1111-111111111111') {
                const colleges = await collegeRepository_1.CollegeRepository.findAll();
                if (colleges.length > 0)
                    collegeId = colleges[0].id;
            }
            else {
                const existing = await collegeRepository_1.CollegeRepository.findById(collegeId);
                if (!existing) {
                    const colleges = await collegeRepository_1.CollegeRepository.findAll();
                    if (colleges.length > 0)
                        collegeId = colleges[0].id;
                }
            }
            const college = await collegeRepository_1.CollegeRepository.findById(collegeId);
            if (!college) {
                (0, response_1.sendError)(res, 'College not found.', 'COLLEGE_NOT_FOUND', null, 404);
                return;
            }
            // Calculate distance to college
            const distanceCheck = mapsProvider_1.MapsProvider.validatePickupWithinServiceRadius(college.latitude, college.longitude, latitude, longitude, college.service_radius_km);
            const pickup = await pickupPointRepository_1.PickupPointRepository.create({
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
                (0, response_1.sendSuccess)(res, `Pickup created, but distance (${distanceCheck.distanceKm} km) exceeds the ${college.service_radius_km} km service area. Marked for manual approval.`, pickup, 201);
                return;
            }
            (0, response_1.sendSuccess)(res, 'Pickup point created within service area.', pickup, 201);
        }
        catch (err) {
            next(err);
        }
    }
    static async updatePickupPoint(req, res, next) {
        try {
            const id = req.params.pointId || req.params.pickupPointId || req.params.id;
            const point = await pickupPointRepository_1.PickupPointRepository.findById(id);
            if (!point) {
                (0, response_1.sendError)(res, 'Pickup point not found.', 'NOT_FOUND', null, 404);
                return;
            }
            const collegeId = req.body.college_id || point.college_id;
            const college = await collegeRepository_1.CollegeRepository.findById(collegeId);
            const updates = { ...req.body };
            if (college) {
                const lat = req.body.latitude !== undefined ? req.body.latitude : point.latitude;
                const lng = req.body.longitude !== undefined ? req.body.longitude : point.longitude;
                const distanceCheck = mapsProvider_1.MapsProvider.validatePickupWithinServiceRadius(college.latitude, college.longitude, lat, lng, college.service_radius_km);
                updates.distance_to_college_km = distanceCheck.distanceKm;
                if (req.body.is_approved === undefined) {
                    updates.is_approved = distanceCheck.isValid;
                }
            }
            const updated = await pickupPointRepository_1.PickupPointRepository.update(id, updates);
            (0, response_1.sendSuccess)(res, 'Pickup point updated successfully.', updated);
        }
        catch (err) {
            next(err);
        }
    }
    static async deletePickupPoint(req, res, next) {
        try {
            const id = req.params.pointId || req.params.pickupPointId || req.params.id;
            await pickupPointRepository_1.PickupPointRepository.delete(id);
            (0, response_1.sendSuccess)(res, 'Pickup point deleted successfully.');
        }
        catch (err) {
            next(err);
        }
    }
    // ROUTES
    static async getRoutes(req, res, next) {
        try {
            let collegeId = (req.query.college_id || req.query.collegeId);
            if (!collegeId && req.user) {
                if (req.user.role === 'STUDENT') {
                    const profile = await userRepository_1.UserRepository.getStudentProfile(req.user.userId);
                    if (profile?.college_id)
                        collegeId = profile.college_id;
                }
                else if (req.user.role === 'DRIVER') {
                    const profile = await userRepository_1.UserRepository.getDriverProfile(req.user.userId);
                    if (profile?.college_id)
                        collegeId = profile.college_id;
                }
            }
            const routes = await routeRepository_1.RouteRepository.findAll(collegeId);
            (0, response_1.sendSuccess)(res, 'Routes retrieved.', routes);
        }
        catch (err) {
            next(err);
        }
    }
    static async getRouteMap(req, res, next) {
        try {
            const routeId = req.params.routeId || req.params.id;
            const route = await routeRepository_1.RouteRepository.findById(routeId);
            if (!route) {
                return (0, response_1.sendError)(res, 'Route not found.', 'ROUTE_NOT_FOUND', null, 404);
            }
            let college = null;
            if (route.college_id) {
                college = await collegeRepository_1.CollegeRepository.findById(route.college_id);
            }
            const stops = (route.stops || []).map((s) => ({
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
            (0, response_1.sendSuccess)(res, 'Route map geometry retrieved.', {
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
        }
        catch (err) {
            next(err);
        }
    }
    static async createRoute(req, res, next) {
        try {
            let collegeId = req.body.college_id;
            if (!collegeId || collegeId === '11111111-1111-1111-1111-111111111111') {
                const colleges = await collegeRepository_1.CollegeRepository.findAll();
                if (colleges.length > 0)
                    collegeId = colleges[0].id;
            }
            else {
                const existing = await collegeRepository_1.CollegeRepository.findById(collegeId);
                if (!existing) {
                    const colleges = await collegeRepository_1.CollegeRepository.findAll();
                    if (colleges.length > 0)
                        collegeId = colleges[0].id;
                }
            }
            if (!collegeId) {
                return (0, response_1.sendError)(res, 'No active college found in system. Please register a college first.', 'COLLEGE_NOT_FOUND', null, 400);
            }
            // Sanitize optional default_vehicle_id
            let defaultVehicleId = req.body.default_vehicle_id || null;
            if (defaultVehicleId) {
                const veh = await vehicleRepository_1.VehicleRepository.findById(defaultVehicleId);
                if (!veh)
                    defaultVehicleId = null;
            }
            // Sanitize optional default_driver_id
            let defaultDriverId = req.body.default_driver_id || null;
            if (defaultDriverId) {
                const client = routeRepository_1.RouteRepository['getClient'] ? routeRepository_1.RouteRepository['getClient']() : null;
                if (client) {
                    const { data: driverUser } = await client
                        .from('users')
                        .select('id')
                        .eq('id', defaultDriverId)
                        .maybeSingle();
                    if (!driverUser)
                        defaultDriverId = null;
                }
            }
            const route = await routeRepository_1.RouteRepository.create({
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
            }, req.body.stops || []);
            (0, response_1.sendSuccess)(res, 'Route created successfully.', route, 201);
        }
        catch (err) {
            next(err);
        }
    }
    // VEHICLES
    static async getVehicles(req, res, next) {
        try {
            const collegeId = req.query.college_id;
            const vehicles = await vehicleRepository_1.VehicleRepository.findAll(collegeId);
            (0, response_1.sendSuccess)(res, 'Vehicles retrieved.', vehicles);
        }
        catch (err) {
            next(err);
        }
    }
    static async createVehicle(req, res, next) {
        try {
            let collegeId = req.body.college_id;
            if (!collegeId || collegeId === '11111111-1111-1111-1111-111111111111') {
                const colleges = await collegeRepository_1.CollegeRepository.findAll();
                if (colleges.length > 0)
                    collegeId = colleges[0].id;
            }
            else {
                const existing = await collegeRepository_1.CollegeRepository.findById(collegeId);
                if (!existing) {
                    const colleges = await collegeRepository_1.CollegeRepository.findAll();
                    if (colleges.length > 0)
                        collegeId = colleges[0].id;
                }
            }
            if (!collegeId) {
                return (0, response_1.sendError)(res, 'No active college found in system. Please register a college first.', 'COLLEGE_NOT_FOUND', null, 400);
            }
            const defaultExpiry = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
            const vehicle = await vehicleRepository_1.VehicleRepository.create({
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
            (0, response_1.sendSuccess)(res, 'Vehicle registered successfully.', vehicle, 201);
        }
        catch (err) {
            next(err);
        }
    }
}
exports.CatalogController = CatalogController;
//# sourceMappingURL=catalogController.js.map