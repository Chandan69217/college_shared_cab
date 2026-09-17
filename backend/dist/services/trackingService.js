"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TrackingService = void 0;
exports.calculateStaleStatus = calculateStaleStatus;
const tripRepository_1 = require("../repositories/tripRepository");
const bookingRepository_1 = require("../repositories/bookingRepository");
const collegeRepository_1 = require("../repositories/collegeRepository");
const supabaseClient_1 = require("../database/supabaseClient");
const geo_1 = require("../utils/geo");
const logger_1 = require("../utils/logger");
function calculateStaleStatus(lastUpdateIso) {
    if (!lastUpdateIso)
        return 'OFFLINE';
    const diffSeconds = (Date.now() - new Date(lastUpdateIso).getTime()) / 1000;
    if (diffSeconds < 30)
        return 'LIVE';
    if (diffSeconds <= 120)
        return 'DELAYED';
    return 'OFFLINE';
}
class TrackingService {
    /**
     * Updates driver live GPS coordinates during active trip in Supabase
     * Authoritative validation: driver authentication, trip status, coordinate sanity, anti-spoofing
     */
    static async updateLocation(driverId, tripId, latitude, longitude, accuracy = 5.0, speed = 0, heading = 0, clientTimestamp) {
        // 1. Basic Coordinate Sanity Bounds
        if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
            const err = new Error('Invalid GPS coordinates: latitude must be in [-90, 90] and longitude in [-180, 180].');
            err.statusCode = 400;
            err.code = 'INVALID_COORDINATES';
            throw err;
        }
        // 2. Anti-Spoofing: Unrealistic Speed Check (> 140 km/h in college shuttle context)
        if (speed > 140) {
            logger_1.logger.warn(`🚨 Suspicious GPS speed recorded for driver ${driverId} on trip ${tripId}: ${speed} km/h`);
            const err = new Error('GPS update rejected: speed exceeds realistic physical vehicle limits.');
            err.statusCode = 400;
            err.code = 'SUSPICIOUS_GPS_SPEED';
            throw err;
        }
        // 3. Find Trip & Verify Driver Assignment
        const trip = await tripRepository_1.TripRepository.findById(tripId);
        if (!trip) {
            const err = new Error('Trip not found.');
            err.statusCode = 404;
            err.code = 'TRIP_NOT_FOUND';
            throw err;
        }
        if (trip.driver_id !== driverId) {
            logger_1.logger.warn(`🚨 Driver ${driverId} attempted to submit location for unassigned trip ${tripId} (assigned to ${trip.driver_id})`);
            const err = new Error('Unauthorized driver: You are not assigned to this trip.');
            err.statusCode = 403;
            err.code = 'UNAUTHORIZED_DRIVER';
            throw err;
        }
        // 4. Lifecycle Check: Only allow GPS updates during active trips
        if (trip.status !== 'IN_PROGRESS') {
            const err = new Error(`Cannot update GPS location for trip in "${trip.status}" status. GPS tracking is only active during IN_PROGRESS trips.`);
            err.statusCode = 400;
            err.code = 'TRIP_NOT_ACTIVE';
            throw err;
        }
        // 5. Anti-Spoofing: Timestamp Freshness (cannot be in the future > 5 min or older than 15 min)
        const now = new Date().toISOString();
        let recordTimestamp = now;
        if (clientTimestamp) {
            const clientTime = new Date(clientTimestamp).getTime();
            const serverTime = Date.now();
            const timeDiffMinutes = Math.abs(serverTime - clientTime) / (1000 * 60);
            if (timeDiffMinutes > 15) {
                logger_1.logger.warn(`⚠️ Out-of-window GPS timestamp received: ${clientTimestamp} vs server ${now}`);
            }
            else {
                recordTimestamp = new Date(clientTimestamp).toISOString();
            }
        }
        // 6. Anti-Spoofing: Consecutive Sudden Teleportation Check (only within active < 60s windows)
        if (trip.live_latitude && trip.live_longitude && trip.last_gps_update) {
            const distanceMovedKm = (0, geo_1.getHaversineDistanceKm)(trip.live_latitude, trip.live_longitude, latitude, longitude);
            const secondsElapsed = Math.max(1, (Date.now() - new Date(trip.last_gps_update).getTime()) / 1000);
            const calculatedSpeedKmh = (distanceMovedKm / secondsElapsed) * 3600;
            if (secondsElapsed < 60 && distanceMovedKm > 25 && calculatedSpeedKmh > 300) {
                logger_1.logger.warn(`🚨 Sudden teleportation detected on trip ${tripId}: moved ${distanceMovedKm.toFixed(1)}km in ${secondsElapsed.toFixed(0)}s (${calculatedSpeedKmh.toFixed(1)} km/h)`);
                const err = new Error('GPS update rejected: impossible coordinate jump detected.');
                err.statusCode = 400;
                err.code = 'SPOOFING_DETECTED';
                throw err;
            }
        }
        // 7. Calculate Stop Progression based on live GPS and Route Stops
        let currentStopSequence = trip.current_stop_sequence || 0;
        const supabase = (0, supabaseClient_1.getSupabaseClient)();
        if (supabase && trip.route_id) {
            try {
                const { data: routeStops } = await supabase
                    .from('route_pickup_points')
                    .select('*, pickup_point:pickup_points(*)')
                    .eq('route_id', trip.route_id)
                    .order('sequence_order', { ascending: true });
                if (routeStops && routeStops.length > 0) {
                    for (const rs of routeStops) {
                        const p = rs.pickup_point;
                        if (p && p.latitude && p.longitude) {
                            const distToStopKm = (0, geo_1.getHaversineDistanceKm)(latitude, longitude, p.latitude, p.longitude);
                            // Within 350m geofence of stop -> marked reached/passed
                            if (distToStopKm <= 0.35) {
                                if (rs.sequence_order > currentStopSequence) {
                                    currentStopSequence = rs.sequence_order;
                                }
                            }
                        }
                    }
                }
            }
            catch (rsErr) {
                logger_1.logger.warn(`Stop progression lookup notice: ${rsErr.message}`);
            }
        }
        // 8. Update Trip Live Coordinates and Stop Progression in repository
        await tripRepository_1.TripRepository.update(tripId, {
            live_latitude: latitude,
            live_longitude: longitude,
            last_gps_update: now,
            current_stop_sequence: currentStopSequence,
        });
        // 9. Upsert in vehicle_current_locations and insert in vehicle_location_history in Supabase
        if (supabase) {
            try {
                // Upsert current location (triggers Supabase Realtime broadcast)
                await supabase.from('vehicle_current_locations').upsert({
                    vehicle_id: trip.vehicle_id,
                    trip_id: tripId,
                    driver_id: driverId,
                    latitude,
                    longitude,
                    accuracy,
                    speed,
                    heading,
                    timestamp: recordTimestamp,
                    updated_at: now,
                }, { onConflict: 'vehicle_id' });
                // Insert historical breadcrumb
                await supabase.from('vehicle_location_history').insert({
                    vehicle_id: trip.vehicle_id,
                    trip_id: tripId,
                    driver_id: driverId,
                    latitude,
                    longitude,
                    accuracy,
                    speed,
                    heading,
                    recorded_at: now,
                });
                // Also backward-compatible with vehicle_locations table if exists
                await supabase.from('vehicle_locations').insert({
                    vehicle_id: trip.vehicle_id,
                    trip_id: tripId,
                    driver_id: driverId,
                    latitude,
                    longitude,
                    speed,
                    heading,
                    recorded_at: now,
                }).select().maybeSingle();
            }
            catch (dbErr) {
                logger_1.logger.warn(`Supabase location persist notice: ${dbErr.message}`);
            }
        }
        return {
            tripId,
            vehicleId: trip.vehicle_id,
            driverId,
            latitude,
            longitude,
            accuracy,
            speed,
            heading,
            currentStopSequence,
            staleStatus: 'LIVE',
            updatedAt: now,
        };
    }
    /**
     * Get vehicle live location for a trip
     */
    static async getTripLocation(tripId) {
        const trip = await tripRepository_1.TripRepository.findById(tripId);
        if (!trip) {
            const err = new Error('Trip not found.');
            err.statusCode = 404;
            err.code = 'TRIP_NOT_FOUND';
            throw err;
        }
        const staleStatus = calculateStaleStatus(trip.last_gps_update);
        const stops = (trip.route?.stops || []);
        const currentSeq = trip.current_stop_sequence || 0;
        const lastPassedStop = stops.find((s) => (s.sequence_order || s.sequenceOrder) === currentSeq) || null;
        const nextStop = stops.find((s) => (s.sequence_order || s.sequenceOrder) === currentSeq + 1) || null;
        return {
            tripId,
            status: trip.status,
            liveLatitude: trip.live_latitude || null,
            liveLongitude: trip.live_longitude || null,
            lastGpsUpdate: trip.last_gps_update || null,
            currentStopSequence: currentSeq,
            lastPassedStop,
            nextStop,
            totalStops: stops.length,
            staleStatus,
            isLive: staleStatus === 'LIVE',
            vehicle: {
                id: trip.vehicle?.id,
                number: trip.vehicle?.vehicle_number,
                model: trip.vehicle?.model,
                type: trip.vehicle?.type,
            },
            driver: {
                id: trip.driver?.id,
                name: trip.driver?.full_name,
                phone: trip.driver?.phone,
            },
            route: {
                id: trip.route?.id,
                name: trip.route?.name,
                code: trip.route?.code,
                estimatedDurationMins: trip.route?.estimated_duration_mins,
                stops,
            },
        };
    }
    /**
     * Get student live tracking view for active trip and booking
     */
    static async getStudentLiveTracking(studentId) {
        const today = new Date().toISOString().split('T')[0];
        const bookings = await bookingRepository_1.BookingRepository.findByStudentId(studentId);
        // Find confirmed booking for today or for an active in-progress trip
        const activeBooking = bookings.find((b) => (b.booking_date === today || b.trip?.status === 'IN_PROGRESS') && b.status === 'CONFIRMED');
        if (!activeBooking || !activeBooking.trip_id) {
            return {
                hasActiveTrip: false,
                message: 'No active booked commute for today. Live tracking will become available when your assigned trip starts.',
                booking: null,
                trip: null,
            };
        }
        const trip = await tripRepository_1.TripRepository.findById(activeBooking.trip_id);
        if (!trip) {
            return {
                hasActiveTrip: false,
                message: 'Associated trip could not be found.',
                booking: activeBooking,
                trip: null,
            };
        }
        const staleStatus = calculateStaleStatus(trip.last_gps_update);
        const hasCoordinates = trip.live_latitude != null && trip.live_longitude != null;
        // Route stops and college info
        let college = null;
        if (trip.route?.college_id) {
            college = await collegeRepository_1.CollegeRepository.findById(trip.route.college_id);
        }
        // Dynamic ETA Calculation
        let etaMinutes = null;
        let distanceToPickupKm = null;
        if (hasCoordinates && activeBooking.pickup_point?.latitude && activeBooking.pickup_point?.longitude) {
            distanceToPickupKm = (0, geo_1.getHaversineDistanceKm)(trip.live_latitude, trip.live_longitude, activeBooking.pickup_point.latitude, activeBooking.pickup_point.longitude);
            // Assuming avg speed of 30 km/h in urban campus routes (2 min per km)
            etaMinutes = Math.max(1, Math.round((distanceToPickupKm / 30) * 60));
        }
        // Query latest delay report if any
        let latestDelay = null;
        const supabase = (0, supabaseClient_1.getSupabaseClient)();
        if (supabase) {
            const { data: delayData } = await supabase
                .from('delay_reports')
                .select('*')
                .eq('trip_id', trip.id)
                .order('reported_at', { ascending: false })
                .limit(1)
                .maybeSingle();
            if (delayData) {
                latestDelay = {
                    delayMinutes: delayData.delay_minutes,
                    reason: delayData.reason,
                    notes: delayData.notes,
                    reportedAt: delayData.reported_at,
                };
            }
        }
        const stops = (trip.route?.stops || []);
        const currentSeq = trip.current_stop_sequence || 0;
        const lastPassedStop = stops.find((s) => (s.sequence_order || s.sequenceOrder) === currentSeq) || null;
        const nextStop = stops.find((s) => (s.sequence_order || s.sequenceOrder) === currentSeq + 1) || null;
        return {
            hasActiveTrip: trip.status === 'IN_PROGRESS' || trip.status === 'DELAYED',
            tripStatus: trip.status,
            booking: {
                id: activeBooking.id,
                bookingDate: activeBooking.booking_date,
                tripType: activeBooking.trip_type,
                seatNumber: activeBooking.seat_number,
                pickupPoint: activeBooking.pickup_point,
                dropPoint: activeBooking.drop_point || (college ? { name: college.name, address: college.address } : null),
            },
            latestDelay,
            trip: {
                id: trip.id,
                tripType: trip.trip_type,
                scheduledDeparture: trip.scheduled_departure_time,
                actualStartTime: trip.actual_start_time,
                currentStopSequence: currentSeq,
                lastPassedStop,
                nextStop,
                liveLatitude: trip.live_latitude || null,
                liveLongitude: trip.live_longitude || null,
                lastGpsUpdate: trip.last_gps_update || null,
                staleStatus,
                isLive: staleStatus === 'LIVE' && (trip.status === 'IN_PROGRESS' || trip.status === 'DELAYED'),
                distanceToPickupKm,
                etaMinutes: (trip.status === 'IN_PROGRESS' || trip.status === 'DELAYED') ? etaMinutes : null,
                vehicle: {
                    id: trip.vehicle?.id,
                    number: trip.vehicle?.vehicle_number,
                    model: trip.vehicle?.model,
                    type: trip.vehicle?.type,
                },
                driver: {
                    id: trip.driver?.id,
                    name: trip.driver?.full_name,
                    phone: trip.driver?.phone,
                },
                route: {
                    id: trip.route?.id,
                    name: trip.route?.name,
                    code: trip.route?.code,
                    stops,
                },
                college: college
                    ? {
                        name: college.name,
                        latitude: college.latitude,
                        longitude: college.longitude,
                        serviceRadiusKm: college.service_radius_km,
                    }
                    : null,
            },
        };
    }
    /**
     * Get all active vehicles for Admin Live Fleet Map
     */
    static async getAllActiveVehicles(collegeId) {
        const trips = await tripRepository_1.TripRepository.findAll(collegeId);
        const activeTrips = trips.filter((t) => t.status === 'IN_PROGRESS' || t.status === 'SCHEDULED');
        return activeTrips.map((trip) => {
            const staleStatus = calculateStaleStatus(trip.last_gps_update);
            return {
                tripId: trip.id,
                tripStatus: trip.status,
                tripType: trip.trip_type,
                latitude: trip.live_latitude || null,
                longitude: trip.live_longitude || null,
                lastUpdated: trip.last_gps_update || null,
                staleStatus,
                isLive: staleStatus === 'LIVE' && trip.status === 'IN_PROGRESS',
                bookedSeats: trip.booked_seats || 0,
                maxCapacity: trip.max_capacity || 6,
                vehicle: {
                    id: trip.vehicle?.id,
                    number: trip.vehicle?.vehicle_number,
                    model: trip.vehicle?.model,
                    type: trip.vehicle?.type,
                },
                driver: {
                    id: trip.driver?.id,
                    name: trip.driver?.full_name || 'Assigned Driver',
                    phone: trip.driver?.phone,
                },
                route: {
                    id: trip.route?.id,
                    name: trip.route?.name,
                    code: trip.route?.code,
                },
            };
        });
    }
    /**
     * Get breadcrumb location history for a specific trip (for route replay & audit)
     */
    static async getTripLocationHistory(tripId) {
        const trip = await tripRepository_1.TripRepository.findById(tripId);
        if (!trip) {
            const err = new Error('Trip not found.');
            err.statusCode = 404;
            err.code = 'TRIP_NOT_FOUND';
            throw err;
        }
        const supabase = (0, supabaseClient_1.getSupabaseClient)();
        let breadcrumbs = [];
        if (supabase) {
            const { data, error } = await supabase
                .from('vehicle_location_history')
                .select('*')
                .eq('trip_id', tripId)
                .order('recorded_at', { ascending: true });
            if (!error && data) {
                breadcrumbs = data;
            }
        }
        // Fallback to vehicle_locations if vehicle_location_history is empty
        if (breadcrumbs.length === 0 && supabase) {
            const { data } = await supabase
                .from('vehicle_locations')
                .select('*')
                .eq('trip_id', tripId)
                .order('recorded_at', { ascending: true });
            if (data)
                breadcrumbs = data;
        }
        return {
            tripId,
            vehicle: trip.vehicle,
            driver: trip.driver,
            route: trip.route,
            tripStatus: trip.status,
            startTime: trip.actual_start_time,
            endTime: trip.actual_end_time,
            totalPoints: breadcrumbs.length,
            breadcrumbs,
        };
    }
}
exports.TrackingService = TrackingService;
//# sourceMappingURL=trackingService.js.map