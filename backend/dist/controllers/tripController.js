"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TripController = void 0;
const trackingService_1 = require("../services/trackingService");
const schemas_1 = require("../validators/schemas");
const response_1 = require("../utils/response");
const tripRepository_1 = require("../repositories/tripRepository");
const vehicleRepository_1 = require("../repositories/vehicleRepository");
class TripController {
    static async getTrips(req, res, next) {
        try {
            const date = req.query.date;
            const trips = await tripRepository_1.TripRepository.findAll(undefined, date);
            (0, response_1.sendSuccess)(res, 'Trips retrieved.', trips);
        }
        catch (err) {
            next(err);
        }
    }
    static async createTrip(req, res, next) {
        try {
            const vehicle = await vehicleRepository_1.VehicleRepository.findById(req.body.vehicle_id);
            const trip = await tripRepository_1.TripRepository.create({
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
            });
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