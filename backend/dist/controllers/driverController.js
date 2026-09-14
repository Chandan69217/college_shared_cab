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
}
exports.DriverController = DriverController;
//# sourceMappingURL=driverController.js.map