"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DriverService = void 0;
const userRepository_1 = require("../repositories/userRepository");
const tripRepository_1 = require("../repositories/tripRepository");
const supabaseClient_1 = require("../database/supabaseClient");
const notificationProvider_1 = require("../integrations/notificationProvider");
class DriverService {
    /**
     * Helper to get current date formatted in IST (Asia/Kolkata)
     */
    static getTodayIST() {
        return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());
    }
    /**
     * Get driver dashboard with active trip, assigned vehicle, today's trips
     */
    static async getDriverDashboard(driverId) {
        const user = await userRepository_1.UserRepository.findById(driverId);
        const profile = await userRepository_1.UserRepository.getDriverProfile(driverId);
        const today = this.getTodayIST();
        const supabase = (0, supabaseClient_1.getSupabaseClient)();
        // 1. Ensure today's trips (both MORNING_PICKUP and EVENING_DROP) are instantiated/synchronized
        await tripRepository_1.TripRepository.syncDailyTripsForDate(today, undefined, driverId);
        let todayTrips = await tripRepository_1.TripRepository.findAssignedTrips(driverId, 'TODAY');
        // Sort today's trips chronologically by scheduled_departure_time
        todayTrips.sort((a, b) => (a.scheduled_departure_time || '00:00:00').localeCompare(b.scheduled_departure_time || '00:00:00'));
        let activeTrip = null;
        // 2. Priority 1: Any currently IN_PROGRESS trip for today
        for (const trip of todayTrips) {
            if (trip.status === 'IN_PROGRESS') {
                activeTrip = trip;
                break;
            }
        }
        // 3. Priority 2: Best matching SCHEDULED trip according to current IST time
        if (!activeTrip) {
            const scheduledTrips = todayTrips.filter((t) => t.status === 'SCHEDULED');
            if (scheduledTrips.length > 0) {
                const nowIST = new Intl.DateTimeFormat('en-GB', {
                    timeZone: 'Asia/Kolkata',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: false,
                }).format(new Date());
                // Find the earliest upcoming scheduled trip whose time is >= nowIST
                const upcoming = scheduledTrips.find((t) => (t.scheduled_departure_time || '00:00:00') >= nowIST);
                activeTrip = upcoming || scheduledTrips[0];
            }
        }
        // 4. Fallback: If all today's trips are COMPLETED, show the latest completed trip
        if (!activeTrip && todayTrips.length > 0) {
            activeTrip = todayTrips[todayTrips.length - 1];
        }
        // 5. Global fallback: Any other IN_PROGRESS trip for this driver
        if (!activeTrip) {
            const { data: inProgressTrips } = await supabase
                .from('trips')
                .select('id')
                .eq('driver_id', driverId)
                .eq('status', 'IN_PROGRESS')
                .limit(1);
            if (inProgressTrips && inProgressTrips.length > 0) {
                activeTrip = await tripRepository_1.TripRepository.findTripWithDetails(inProgressTrips[0].id, driverId);
            }
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
     * Get all scheduled trips for driver with tab filtering (TODAY, UPCOMING, COMPLETED, ALL)
     */
    static async getScheduledTrips(driverId, filter = 'ALL') {
        const today = this.getTodayIST();
        // Auto-sync today's morning and evening trips for all assigned routes
        await tripRepository_1.TripRepository.syncDailyTripsForDate(today, undefined, driverId);
        const filterUpper = (filter || 'ALL').toUpperCase();
        const trips = await tripRepository_1.TripRepository.findAssignedTrips(driverId, filterUpper);
        // Grouping stats
        const allTrips = filterUpper === 'ALL' ? trips : await tripRepository_1.TripRepository.findAssignedTrips(driverId, 'ALL');
        const todayCount = allTrips.filter((t) => t.trip_date === today).length;
        const upcomingCount = allTrips.filter((t) => t.trip_date > today && t.status !== 'COMPLETED').length;
        const completedCount = allTrips.filter((t) => t.status === 'COMPLETED' || t.trip_date < today).length;
        return {
            trips,
            count: trips.length,
            filter: filterUpper,
            todayDate: today,
            stats: {
                today: todayCount,
                upcoming: upcomingCount,
                completed: completedCount,
                total: allTrips.length,
            },
        };
    }
    /**
     * Get full details for a single trip
     */
    static async getTripDetails(tripId, driverId) {
        const trip = await tripRepository_1.TripRepository.findTripWithDetails(tripId, driverId);
        if (!trip) {
            const err = new Error('Trip not found or driver unauthorized.');
            err.statusCode = 404;
            err.code = 'TRIP_NOT_FOUND';
            throw err;
        }
        return trip;
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
        const now = new Date().toISOString();
        const supabase = (0, supabaseClient_1.getSupabaseClient)();
        if (supabase) {
            // 1. Mark any remaining unboarded 'WAITING' passengers as 'NO_SHOW'
            await supabase
                .from('trip_passengers')
                .update({ status: 'NO_SHOW', updated_at: now })
                .eq('trip_id', tripId)
                .eq('status', 'WAITING');
            // 2. Mark any unboarded passes as EXPIRED
            await supabase
                .from('daily_travel_passes')
                .update({ status: 'EXPIRED', updated_at: now })
                .eq('trip_id', tripId)
                .eq('status', 'ACTIVE');
        }
        return tripRepository_1.TripRepository.update(tripId, {
            status: 'COMPLETED',
            actual_end_time: now,
        });
    }
    /**
     * Report delay on active trip and broadcast alert to booked students
     */
    static async reportDelay(tripId, driverId, data) {
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
        const supabase = (0, supabaseClient_1.getSupabaseClient)();
        const now = new Date().toISOString();
        // 1. Record delay in delay_reports
        const { data: delayReport, error } = await supabase
            .from('delay_reports')
            .insert([{
                trip_id: tripId,
                driver_id: driverId,
                delay_minutes: data.delayMinutes || 15,
                reason: data.reason || 'TRAFFIC',
                current_stop_id: data.currentStopId,
                notes: data.notes || '',
                reported_at: now,
            }])
            .select('*')
            .single();
        if (error)
            throw new Error(`Record delay error: ${error.message}`);
        // 2. Delay recorded in delay_reports (trip remains SCHEDULED or IN_PROGRESS)
        // 3. Notify all booked passengers
        const passengers = await tripRepository_1.TripRepository.getTripPassengers(tripId);
        for (const p of passengers) {
            if (p.student_id) {
                await notificationProvider_1.NotificationProvider.send(p.student_id, 'Trip Delay Notice', `Your vehicle on Route "${trip.route?.name || 'Assigned Route'}" is delayed by approx ${data.delayMinutes || 15} mins. Reason: ${data.reason}`, 'TRIP', { tripId, delayMinutes: data.delayMinutes, reason: data.reason });
            }
        }
        return delayReport;
    }
    /**
     * Update individual passenger manifest status (e.g. NO_SHOW, CANCELLED, BOARDED)
     */
    static async updatePassengerStatus(tripId, driverId, studentId, status, notes) {
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
        const supabase = (0, supabaseClient_1.getSupabaseClient)();
        const now = new Date().toISOString();
        const { data, error } = await supabase
            .from('trip_passengers')
            .update({
            status,
            verified_by_driver_id: driverId,
            updated_at: now,
        })
            .eq('trip_id', tripId)
            .eq('student_id', studentId)
            .select('*')
            .single();
        if (error)
            throw new Error(`Update passenger status error: ${error.message}`);
        // If marked BOARDED, update boarded count
        if (status === 'BOARDED') {
            await tripRepository_1.TripRepository.update(tripId, {
                boarded_passengers: (trip.boarded_passengers || 0) + 1,
            });
        }
        return data;
    }
}
exports.DriverService = DriverService;
//# sourceMappingURL=driverService.js.map