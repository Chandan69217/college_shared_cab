"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DriverController = void 0;
const driverService_1 = require("../services/driverService");
const response_1 = require("../utils/response");
class DriverController {
    static async getDashboard(req, res, next) {
        try {
            const driverId = req.user.userId;
            const data = await driverService_1.DriverService.getDriverDashboard(driverId);
            (0, response_1.sendSuccess)(res, 'Driver dashboard retrieved.', data);
        }
        catch (err) {
            next(err);
        }
    }
    static async getScheduledTrips(req, res, next) {
        try {
            const driverId = req.user.userId;
            const filter = (req.query.filter || req.query.tab || 'ALL');
            const data = await driverService_1.DriverService.getScheduledTrips(driverId, filter);
            (0, response_1.sendSuccess)(res, 'Driver scheduled trips retrieved.', data);
        }
        catch (err) {
            next(err);
        }
    }
    static async getTripDetails(req, res, next) {
        try {
            const driverId = req.user.userId;
            const tripId = req.params.tripId || req.params.id;
            const trip = await driverService_1.DriverService.getTripDetails(tripId, driverId);
            (0, response_1.sendSuccess)(res, 'Trip details retrieved.', trip);
        }
        catch (err) {
            next(err);
        }
    }
    static async getManifest(req, res, next) {
        try {
            const driverId = req.user.userId;
            const tripId = req.params.tripId;
            const manifest = await driverService_1.DriverService.getTripManifest(tripId, driverId);
            (0, response_1.sendSuccess)(res, 'Trip manifest retrieved.', manifest);
        }
        catch (err) {
            next(err);
        }
    }
    static async startTrip(req, res, next) {
        try {
            const driverId = req.user.userId;
            const tripId = req.params.tripId;
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
            const tripId = req.params.tripId;
            const trip = await driverService_1.DriverService.endTrip(tripId, driverId);
            (0, response_1.sendSuccess)(res, 'Trip ended successfully.', trip);
        }
        catch (err) {
            next(err);
        }
    }
    static async reportDelay(req, res, next) {
        try {
            const driverId = req.user.userId;
            const tripId = req.params.tripId;
            const { delay_minutes, delayMinutes, reason, current_stop_id, currentStopId, notes } = req.body;
            const result = await driverService_1.DriverService.reportDelay(tripId, driverId, {
                delayMinutes: Number(delay_minutes || delayMinutes || 15),
                reason: reason || 'TRAFFIC',
                currentStopId: current_stop_id || currentStopId,
                notes,
            });
            (0, response_1.sendSuccess)(res, 'Trip delay reported and passengers notified.', result);
        }
        catch (err) {
            next(err);
        }
    }
    static async updatePassengerStatus(req, res, next) {
        try {
            const driverId = req.user.userId;
            const tripId = req.params.tripId;
            const studentId = req.params.studentId;
            const { status, notes } = req.body;
            const result = await driverService_1.DriverService.updatePassengerStatus(tripId, driverId, studentId, status, notes);
            (0, response_1.sendSuccess)(res, `Passenger status updated to ${status}.`, result);
        }
        catch (err) {
            next(err);
        }
    }
}
exports.DriverController = DriverController;
//# sourceMappingURL=driverController.js.map