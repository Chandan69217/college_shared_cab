"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DriverService = void 0;
const userRepository_1 = require("../repositories/userRepository");
const tripRepository_1 = require("../repositories/tripRepository");
class DriverService {
    /**
     * Get driver dashboard with active trip, assigned vehicle, today's trips
     */
    static async getDriverDashboard(driverId) {
        const user = await userRepository_1.UserRepository.findById(driverId);
        const profile = await userRepository_1.UserRepository.getDriverProfile(driverId);
        const today = new Date().toISOString().split('T')[0];
        const todayTrips = await tripRepository_1.TripRepository.findByDriverId(driverId, today);
        let activeTrip = null;
        for (const trip of todayTrips) {
            if (trip.status === 'IN_PROGRESS') {
                activeTrip = trip;
                break;
            }
        }
        if (!activeTrip && todayTrips.length > 0) {
            activeTrip = todayTrips[0];
        }
        return {
            driver: {
                id: user?.id,
                full_name: user?.full_name,
                phone: user?.phone,
                email: user?.email,
            },
            profile,
            activeTrip,
            todayTrips,
            totalTripsToday: todayTrips.length,
        };
    }
    /**
     * Get passengers manifest for a specific trip
     */
    static async getTripManifest(tripId, driverId) {
        const trip = await tripRepository_1.TripRepository.findById(tripId);
        if (!trip) {
            const err = new Error('Trip not found.');
            err.statusCode = 404;
            err.code = 'TRIP_NOT_FOUND';
            throw err;
        }
        if (trip.driver_id !== driverId) {
            const err = new Error('Driver is not assigned to this trip.');
            err.statusCode = 403;
            err.code = 'UNAUTHORIZED_DRIVER';
            throw err;
        }
        return tripRepository_1.TripRepository.getTripPassengers(tripId);
    }
    /**
     * Start Trip
     */
    static async startTrip(tripId, driverId) {
        const trip = await tripRepository_1.TripRepository.findById(tripId);
        if (!trip) {
            const err = new Error('Trip not found.');
            err.statusCode = 404;
            err.code = 'TRIP_NOT_FOUND';
            throw err;
        }
        if (trip.driver_id !== driverId) {
            const err = new Error('Driver is not assigned to this trip.');
            err.statusCode = 403;
            err.code = 'UNAUTHORIZED_DRIVER';
            throw err;
        }
        return tripRepository_1.TripRepository.update(tripId, {
            status: 'IN_PROGRESS',
            actual_start_time: new Date().toISOString(),
        });
    }
    /**
     * End Trip
     */
    static async endTrip(tripId, driverId) {
        const trip = await tripRepository_1.TripRepository.findById(tripId);
        if (!trip) {
            const err = new Error('Trip not found.');
            err.statusCode = 404;
            err.code = 'TRIP_NOT_FOUND';
            throw err;
        }
        if (trip.driver_id !== driverId) {
            const err = new Error('Driver is not assigned to this trip.');
            err.statusCode = 403;
            err.code = 'UNAUTHORIZED_DRIVER';
            throw err;
        }
        return tripRepository_1.TripRepository.update(tripId, {
            status: 'COMPLETED',
            actual_end_time: new Date().toISOString(),
        });
    }
}
exports.DriverService = DriverService;
//# sourceMappingURL=driverService.js.map