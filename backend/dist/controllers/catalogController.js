"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CatalogController = void 0;
const db_1 = require("../database/db");
const mapsProvider_1 = require("../integrations/mapsProvider");
const response_1 = require("../utils/response");
class CatalogController {
    // COLLEGES
    static async getColleges(req, res, next) {
        try {
            const colleges = Array.from(db_1.db.colleges.values());
            (0, response_1.sendSuccess)(res, 'Colleges retrieved.', colleges);
        }
        catch (err) {
            next(err);
        }
    }
    static async createCollege(req, res, next) {
        try {
            const id = `col-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
            const now = new Date().toISOString();
            const college = {
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
            db_1.db.colleges.set(id, college);
            (0, response_1.sendSuccess)(res, 'College created successfully.', college, 201);
        }
        catch (err) {
            next(err);
        }
    }
    // PICKUP POINTS
    static async getPickupPoints(req, res, next) {
        try {
            const collegeId = req.query.college_id;
            let points = Array.from(db_1.db.pickupPoints.values());
            if (collegeId) {
                points = points.filter((p) => p.college_id === collegeId);
            }
            (0, response_1.sendSuccess)(res, 'Pickup points retrieved.', points);
        }
        catch (err) {
            next(err);
        }
    }
    static async createPickupPoint(req, res, next) {
        try {
            const { college_id, name, landmark, address, latitude, longitude } = req.body;
            const college = db_1.db.colleges.get(college_id);
            if (!college) {
                (0, response_1.sendError)(res, 'College not found.', 'COLLEGE_NOT_FOUND', null, 404);
                return;
            }
            // Calculate distance to college
            const distanceCheck = mapsProvider_1.MapsProvider.validatePickupWithinServiceRadius(college.latitude, college.longitude, latitude, longitude, college.service_radius_km);
            const id = `pk-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
            const now = new Date().toISOString();
            const pickup = {
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
            db_1.db.pickupPoints.set(id, pickup);
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
    // ROUTES
    static async getRoutes(req, res, next) {
        try {
            const routes = Array.from(db_1.db.routes.values());
            (0, response_1.sendSuccess)(res, 'Routes retrieved.', routes);
        }
        catch (err) {
            next(err);
        }
    }
    static async createRoute(req, res, next) {
        try {
            const id = `rt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
            const now = new Date().toISOString();
            const route = {
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
            db_1.db.routes.set(id, route);
            (0, response_1.sendSuccess)(res, 'Route created successfully.', route, 201);
        }
        catch (err) {
            next(err);
        }
    }
    // VEHICLES
    static async getVehicles(req, res, next) {
        try {
            const vehicles = Array.from(db_1.db.vehicles.values());
            (0, response_1.sendSuccess)(res, 'Vehicles retrieved.', vehicles);
        }
        catch (err) {
            next(err);
        }
    }
    static async createVehicle(req, res, next) {
        try {
            const id = `veh-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
            const now = new Date().toISOString();
            const vehicle = {
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
            db_1.db.vehicles.set(id, vehicle);
            (0, response_1.sendSuccess)(res, 'Vehicle registered successfully.', vehicle, 201);
        }
        catch (err) {
            next(err);
        }
    }
}
exports.CatalogController = CatalogController;
//# sourceMappingURL=catalogController.js.map