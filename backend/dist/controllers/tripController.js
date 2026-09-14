"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TripController = void 0;
const db_1 = require("../database/db");
const trackingService_1 = require("../services/trackingService");
const schemas_1 = require("../validators/schemas");
const response_1 = require("../utils/response");
class TripController {
    static async getTrips(req, res, next) {
        try {
            const date = req.query.date;
            let trips = Array.from(db_1.db.trips.values());
            if (date) {
                trips = trips.filter((t) => t.trip_date === date);
            }
            const hydrated = trips.map((t) => ({
                ...t,
                route: db_1.db.routes.get(t.route_id),
                vehicle: db_1.db.vehicles.get(t.vehicle_id),
                driver: db_1.db.users.get(t.driver_id),
            }));
            (0, response_1.sendSuccess)(res, 'Trips retrieved.', hydrated);
        }
        catch (err) {
            next(err);
        }
    }
    static async createTrip(req, res, next) {
        try {
            const id = `trip-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
            const now = new Date().toISOString();
            const vehicle = db_1.db.vehicles.get(req.body.vehicle_id);
            const trip = {
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
            db_1.db.trips.set(id, trip);
            (0, response_1.sendSuccess)(res, 'Trip scheduled successfully.', trip, 201);
        }
        catch (err) {
            next(err);
        }
    }
    static async updateLocation(req, res, next) {
        try {
            const driverId = req.user.userId;
            const validated = schemas_1.updateGpsLocationSchema.parse(req.body);
            const result = await trackingService_1.TrackingService.updateLocation(driverId, validated.trip_id, validated.latitude, validated.longitude, validated.speed, validated.heading);
            (0, response_1.sendSuccess)(res, 'GPS location updated.', result);
        }
        catch (err) {
            next(err);
        }
    }
    static async getTripLocation(req, res, next) {
        try {
            const tripId = req.params.id;
            const result = await trackingService_1.TrackingService.getTripLocation(tripId);
            (0, response_1.sendSuccess)(res, 'Live vehicle location retrieved.', result);
        }
        catch (err) {
            next(err);
        }
    }
    static async getAllActiveLocations(req, res, next) {
        try {
            const result = await trackingService_1.TrackingService.getAllActiveVehicles();
            (0, response_1.sendSuccess)(res, 'Active fleet locations retrieved.', result);
        }
        catch (err) {
            next(err);
        }
    }
}
exports.TripController = TripController;
//# sourceMappingURL=tripController.js.map