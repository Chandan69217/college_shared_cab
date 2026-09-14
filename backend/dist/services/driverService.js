"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DriverService = void 0;
const db_1 = require("../database/db");
class DriverService {
    /**
     * Get driver dashboard with active trip, assigned vehicle, today's trips
     */
    static async getDriverDashboard(driverId) {
        const user = db_1.db.users.get(driverId);
        const profile = db_1.db.driverProfiles.get(driverId);
        const today = new Date().toISOString().split('T')[0];
        const todayTrips = [];
        let activeTrip = null;
        for (const trip of db_1.db.trips.values()) {
            if (trip.driver_id === driverId && trip.trip_date === today) {
                const route = db_1.db.routes.get(trip.route_id);
                const vehicle = db_1.db.vehicles.get(trip.vehicle_id);
                const hydratedTrip = { ...trip, route, vehicle };
                todayTrips.push(hydratedTrip);
                if (trip.status === 'IN_PROGRESS') {
                    activeTrip = hydratedTrip;
                }
            }
        }
        // Default to first scheduled trip if none is in progress
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
        const trip = db_1.db.trips.get(tripId);
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
        const passengers = [];
        for (const p of db_1.db.tripPassengers.values()) {
            if (p.trip_id === tripId) {
                const student = db_1.db.users.get(p.student_id);
                const pickup = db_1.db.pickupPoints.get(p.pickup_point_id);
                passengers.push({
                    ...p,
                    student: student
                        ? {
                            id: student.id,
                            full_name: student.full_name,
                            phone: student.phone,
                            email: student.email,
                            role: student.role,
                            status: student.status,
                            password_hash: '',
                            created_at: student.created_at,
                            updated_at: student.updated_at,
                        }
                        : undefined,
                    pickup_point: pickup,
                });
            }
        }
        return passengers;
    }
    /**
     * Start Trip
     */
    static async startTrip(tripId, driverId) {
        const trip = db_1.db.trips.get(tripId);
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
        trip.status = 'IN_PROGRESS';
        trip.actual_start_time = new Date().toISOString();
        trip.updated_at = new Date().toISOString();
        db_1.db.trips.set(tripId, trip);
        return trip;
    }
    /**
     * End Trip
     */
    static async endTrip(tripId, driverId) {
        const trip = db_1.db.trips.get(tripId);
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
        trip.status = 'COMPLETED';
        trip.actual_end_time = new Date().toISOString();
        trip.updated_at = new Date().toISOString();
        db_1.db.trips.set(tripId, trip);
        // Update unboarded passengers to NO_SHOW
        for (const [key, p] of db_1.db.tripPassengers.entries()) {
            if (p.trip_id === tripId && p.status === 'WAITING') {
                p.status = 'NO_SHOW';
                p.updated_at = new Date().toISOString();
                db_1.db.tripPassengers.set(key, p);
            }
        }
        return trip;
    }
}
exports.DriverService = DriverService;
//# sourceMappingURL=driverService.js.map