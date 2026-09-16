"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TripController = void 0;
const trackingService_1 = require("../services/trackingService");
const driverService_1 = require("../services/driverService");
const schemas_1 = require("../validators/schemas");
const response_1 = require("../utils/response");
const tripRepository_1 = require("../repositories/tripRepository");
const vehicleRepository_1 = require("../repositories/vehicleRepository");
class TripController {
    static async getTrips(req, res, next) {
        try {
            const date = req.query.date;
            const collegeId = req.query.college_id;
            const todayIST = date || new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());
            await tripRepository_1.TripRepository.syncDailyTripsForDate(todayIST);
            const trips = await tripRepository_1.TripRepository.findAll(collegeId, date);
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
                max_capacity: req.body.max_capacity ? Number(req.body.max_capacity) : (vehicle?.seating_capacity || 6),
                booked_seats: 0,
                boarded_passengers: 0,
            });
            (0, response_1.sendSuccess)(res, 'Trip scheduled successfully.', trip, 201);
        }
        catch (err) {
            next(err);
        }
    }
    static async startTrip(req, res, next) {
        try {
            const driverId = req.user.userId;
            const tripId = req.params.tripId || req.params.id;
            const trip = await driverService_1.DriverService.startTrip(tripId, driverId);
            (0, response_1.sendSuccess)(res, 'Trip started successfully.', trip);
        }
        catch (err) {
            next(err);
        }
    }
    static async endTrip(req, res, next) {
        try {
            const driverId = req.user.userId;
            const tripId = req.params.tripId || req.params.id;
            const trip = await driverService_1.DriverService.endTrip(tripId, driverId);
            (0, response_1.sendSuccess)(res, 'Trip ended successfully.', trip);
        }
        catch (err) {
            next(err);
        }
    }
    static async updateLocation(req, res, next) {
        try {
            const driverId = req.user.userId;
            const tripId = req.params.tripId || req.params.id || req.body.trip_id;
            if (!tripId) {
                const err = new Error('Trip ID is required.');
                err.statusCode = 400;
                err.code = 'MISSING_TRIP_ID';
                throw err;
            }
            const validated = schemas_1.updateGpsLocationSchema.parse(req.body);
            const result = await trackingService_1.TrackingService.updateLocation(driverId, tripId, validated.latitude, validated.longitude, validated.accuracy, validated.speed, validated.heading, validated.timestamp);
            (0, response_1.sendSuccess)(res, 'GPS location updated.', result);
        }
        catch (err) {
            next(err);
        }
    }
    static async getTripLocation(req, res, next) {
        try {
            const tripId = req.params.tripId || req.params.id;
            const result = await trackingService_1.TrackingService.getTripLocation(tripId);
            (0, response_1.sendSuccess)(res, 'Live vehicle location retrieved.', result);
        }
        catch (err) {
            next(err);
        }
    }
    static async getAllActiveLocations(req, res, next) {
        try {
            const collegeId = req.query.college_id;
            const result = await trackingService_1.TrackingService.getAllActiveVehicles(collegeId);
            (0, response_1.sendSuccess)(res, 'Active fleet locations retrieved.', result);
        }
        catch (err) {
            next(err);
        }
    }
    static async getTripHistory(req, res, next) {
        try {
            const tripId = req.params.tripId || req.params.id;
            const result = await trackingService_1.TrackingService.getTripLocationHistory(tripId);
            (0, response_1.sendSuccess)(res, 'Trip location history retrieved.', result);
        }
        catch (err) {
            next(err);
        }
    }
}
exports.TripController = TripController;
//# sourceMappingURL=tripController.js.map