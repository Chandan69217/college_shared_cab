"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BookingService = void 0;
const crypto_1 = require("../utils/crypto");
const notificationProvider_1 = require("../integrations/notificationProvider");
const bookingRepository_1 = require("../repositories/bookingRepository");
const userRepository_1 = require("../repositories/userRepository");
const tripRepository_1 = require("../repositories/tripRepository");
const subscriptionRepository_1 = require("../repositories/subscriptionRepository");
const pickupPointRepository_1 = require("../repositories/pickupPointRepository");
const supabaseClient_1 = require("../database/supabaseClient");
const geo_1 = require("../utils/geo");
class BookingService {
    static tripLocks = new Map();
    /**
     * Check route, stop validity and live cab availability before booking
     */
    static async checkAvailability(studentId, routeId, pickupPointId, dropPointId, tripId, tripType) {
        const supabase = (0, supabaseClient_1.getSupabaseClient)();
        const todayIST = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());
        if (!pickupPointId) {
            return {
                available: false,
                reason: 'MISSING_PICKUP_POINT',
                message: 'Pickup point ID is required.',
                trips: [],
            };
        }
        // 1. Verify student profile verification status
        const studentProfile = await userRepository_1.UserRepository.getStudentProfile(studentId);
        if (!studentProfile || studentProfile.verification_status !== 'VERIFIED') {
            return {
                available: false,
                reason: 'STUDENT_NOT_VERIFIED',
                message: 'Student account is pending administrative verification. Booking is disabled.',
                trips: [],
            };
        }
        // 2. Verify subscription
        const activeSub = await subscriptionRepository_1.SubscriptionRepository.findActiveByStudentId(studentId);
        if (!activeSub || (activeSub.remaining_rides || 0) <= 0) {
            return {
                available: false,
                reason: 'NO_ACTIVE_SUBSCRIPTION',
                message: 'No active subscription with available ride credits found. Please purchase a plan.',
                trips: [],
            };
        }
        let targetRouteId = routeId;
        if (tripId && !targetRouteId) {
            const tripObj = await tripRepository_1.TripRepository.findById(tripId);
            if (tripObj) {
                targetRouteId = tripObj.route_id;
            }
        }
        if (!targetRouteId) {
            return {
                available: false,
                reason: 'INVALID_ROUTE',
                message: 'Route ID is required for checking availability.',
                trips: [],
            };
        }
        // 3. Verify Route exists & active
        const { data: route, error: routeErr } = await supabase
            .from('routes')
            .select('*, college:colleges(*), route_pickup_points(*, pickup_point:pickup_points(*))')
            .eq('id', targetRouteId)
            .maybeSingle();
        if (routeErr || !route || !route.is_active) {
            return {
                available: false,
                reason: 'INVALID_ROUTE',
                message: 'No active route found for the selected identifier.',
                trips: [],
            };
        }
        // 4. Validate Pickup Point on this Route
        const pickupStop = (route.route_pickup_points || []).find((rpp) => rpp.pickup_point_id === pickupPointId);
        if (!pickupStop) {
            return {
                available: false,
                reason: 'INVALID_PICKUP_FOR_ROUTE',
                message: 'This pickup point does not belong to the selected route.',
                trips: [],
            };
        }
        // 5. Validate Drop Point if provided
        let dropStop = null;
        if (dropPointId) {
            dropStop = (route.route_pickup_points || []).find((rpp) => rpp.pickup_point_id === dropPointId);
            if (!dropStop) {
                return {
                    available: false,
                    reason: 'INVALID_DROP_FOR_ROUTE',
                    message: 'This drop point is not valid for the selected route.',
                    trips: [],
                };
            }
            if (dropStop.sequence_order <= pickupStop.sequence_order) {
                return {
                    available: false,
                    reason: 'INVALID_STOP_SEQUENCE',
                    message: 'Drop point must be located after the pickup point along the route sequence.',
                    trips: [],
                };
            }
        }
        // 6. Ensure daily trips are instantiated for today
        await tripRepository_1.TripRepository.syncDailyTripsForDate(todayIST, targetRouteId);
        // 7. Find active/scheduled trips for today on this route
        let tripsQuery = supabase
            .from('trips')
            .select('*, vehicle:vehicles(*), driver:users!trips_driver_id_fkey(*)')
            .eq('route_id', targetRouteId)
            .eq('trip_date', todayIST)
            .in('status', ['SCHEDULED', 'IN_PROGRESS']);
        if (tripId) {
            tripsQuery = tripsQuery.eq('id', tripId);
        }
        if (tripType) {
            tripsQuery = tripsQuery.eq('trip_type', tripType);
        }
        const { data: routeTrips, error: tripsErr } = await tripsQuery;
        if (tripsErr || !routeTrips || routeTrips.length === 0) {
            return {
                available: false,
                reason: 'NO_CABS_ON_ROUTE',
                message: 'No active cab is currently available for this route.',
                trips: [],
            };
        }
        let hasPassedAll = true;
        let hasFullCapacity = true;
        const eligibleTrips = [];
        const pickupPointData = pickupStop.pickup_point;
        for (const trip of routeTrips) {
            const seatsLeft = (trip.max_capacity || 6) - (trip.booked_seats || 0);
            const isFull = seatsLeft <= 0;
            if (!isFull)
                hasFullCapacity = false;
            const currentStopSeq = trip.current_stop_sequence || 0;
            const hasPassed = trip.status === 'IN_PROGRESS' && currentStopSeq >= pickupStop.sequence_order;
            if (!hasPassed)
                hasPassedAll = false;
            // Distance & ETA calculation
            let distanceToPickupKm = null;
            let etaMinutes = null;
            if (trip.live_latitude && trip.live_longitude && pickupPointData?.latitude && pickupPointData?.longitude) {
                distanceToPickupKm = (0, geo_1.getHaversineDistanceKm)(trip.live_latitude, trip.live_longitude, pickupPointData.latitude, pickupPointData.longitude);
                etaMinutes = Math.max(1, Math.round((distanceToPickupKm / 30) * 60));
            }
            const isEligible = !isFull && !hasPassed;
            eligibleTrips.push({
                id: trip.id,
                tripType: trip.trip_type,
                status: trip.status,
                scheduledDepartureTime: trip.scheduled_departure_time,
                actualStartTime: trip.actual_start_time,
                maxCapacity: trip.max_capacity,
                bookedSeats: trip.booked_seats,
                availableSeats: Math.max(0, seatsLeft),
                currentStopSequence: currentStopSeq,
                hasPassedPickupStop: hasPassed,
                isFull,
                isEligible,
                distanceToPickupKm,
                etaMinutes,
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
            });
        }
        const availableTrips = eligibleTrips.filter((t) => t.isEligible);
        if (availableTrips.length === 0) {
            if (hasPassedAll) {
                return {
                    available: false,
                    reason: 'ALL_CABS_PASSED_STOP',
                    message: 'All available cabs have already passed this pickup point. Please try another pickup point or try again later.',
                    trips: eligibleTrips,
                };
            }
            if (hasFullCapacity) {
                return {
                    available: false,
                    reason: 'ALL_CABS_FULL',
                    message: 'The selected cab is full. All cabs on this route have reached maximum capacity.',
                    trips: eligibleTrips,
                };
            }
            return {
                available: false,
                reason: 'NO_ELIGIBLE_CAB',
                message: 'No eligible cab is currently available for your selected pickup point.',
                trips: eligibleTrips,
            };
        }
        return {
            available: true,
            reason: 'OK',
            message: `${availableTrips.length} cab(s) available on this route.`,
            trips: eligibleTrips,
            availableTrips,
        };
    }
    /**
     * Concurrency-safe atomic ride booking with Supabase
     */
    static async bookRide(studentId, tripId, pickupPointId, dropPointId) {
        while (this.tripLocks.has(tripId)) {
            await this.tripLocks.get(tripId);
        }
        let releaseLock = () => { };
        const lockPromise = new Promise((resolve) => {
            releaseLock = resolve;
        });
        this.tripLocks.set(tripId, lockPromise);
        try {
            // 1. Verify student profile verification status in Supabase
            const studentProfile = await userRepository_1.UserRepository.getStudentProfile(studentId);
            if (!studentProfile || studentProfile.verification_status !== 'VERIFIED') {
                const err = new Error('Student account is pending administrative verification. Booking is disabled.');
                err.statusCode = 403;
                err.code = 'STUDENT_NOT_VERIFIED';
                throw err;
            }
            // 2. Verify Trip exists & is in eligible status (SCHEDULED or IN_PROGRESS)
            const trip = await tripRepository_1.TripRepository.findById(tripId);
            if (!trip) {
                const err = new Error('Selected trip not found.');
                err.statusCode = 404;
                err.code = 'TRIP_NOT_FOUND';
                throw err;
            }
            if (trip.status !== 'SCHEDULED' && trip.status !== 'IN_PROGRESS') {
                const err = new Error(`Trip is not open for booking (status: ${trip.status}).`);
                err.statusCode = 400;
                err.code = 'TRIP_UNAVAILABLE';
                throw err;
            }
            // 3. Verify Active Subscription with remaining rides
            const activeSub = await subscriptionRepository_1.SubscriptionRepository.findActiveByStudentId(studentId);
            if (!activeSub || (activeSub.remaining_rides || 0) <= 0) {
                const err = new Error('No active subscription with available ride credits found. Please purchase a plan.');
                err.statusCode = 402;
                err.code = 'NO_ACTIVE_SUBSCRIPTION';
                throw err;
            }
            // 4. Validate Pickup Point
            const pickupPoint = await pickupPointRepository_1.PickupPointRepository.findById(pickupPointId);
            if (!pickupPoint || !pickupPoint.is_active || !pickupPoint.is_approved) {
                const err = new Error('Invalid or unapproved pickup point.');
                err.statusCode = 400;
                err.code = 'INVALID_PICKUP_POINT';
                throw err;
            }
            // 5. Validate Pickup Point belongs to Trip Route
            const supabase = (0, supabaseClient_1.getSupabaseClient)();
            const { data: pickupStop } = await supabase
                .from('route_pickup_points')
                .select('sequence_order')
                .eq('route_id', trip.route_id)
                .eq('pickup_point_id', pickupPointId)
                .maybeSingle();
            if (!pickupStop) {
                const err = new Error('This pickup point does not belong to the selected route.');
                err.statusCode = 400;
                err.code = 'INVALID_PICKUP_FOR_ROUTE';
                throw err;
            }
            // 6. Validate Drop Point if provided
            let dropPoint = null;
            if (dropPointId) {
                dropPoint = await pickupPointRepository_1.PickupPointRepository.findById(dropPointId);
                const { data: dropStop } = await supabase
                    .from('route_pickup_points')
                    .select('sequence_order')
                    .eq('route_id', trip.route_id)
                    .eq('pickup_point_id', dropPointId)
                    .maybeSingle();
                if (!dropStop) {
                    const err = new Error('This drop point is not valid for the selected route.');
                    err.statusCode = 400;
                    err.code = 'INVALID_DROP_FOR_ROUTE';
                    throw err;
                }
                if (dropStop.sequence_order <= pickupStop.sequence_order) {
                    const err = new Error('Drop point must be located after the pickup point along the route sequence.');
                    err.statusCode = 400;
                    err.code = 'INVALID_STOP_SEQUENCE';
                    throw err;
                }
            }
            // 7. Stop progression check for active trip
            if (trip.status === 'IN_PROGRESS') {
                const currentStopSeq = trip.current_stop_sequence || 0;
                if (pickupStop.sequence_order <= currentStopSeq) {
                    const err = new Error('All available cabs have already passed this pickup point. Please try another pickup point or try again later.');
                    err.statusCode = 400;
                    err.code = 'STOP_ALREADY_PASSED';
                    throw err;
                }
            }
            // 8. Generate Dynamic HMAC QR token
            const tempPassId = `pass_${Date.now()}`;
            const { token: qrToken, expiresAt } = (0, crypto_1.generateDynamicQrToken)(tempPassId, studentId, tripId, trip.route_id, trip.trip_date, 180);
            // 9. Execute atomic PostgreSQL booking procedure
            let atomicResult;
            try {
                atomicResult = await bookingRepository_1.BookingRepository.bookTripAtomic(studentId, activeSub.id, tripId, pickupPointId, qrToken, new Date(expiresAt), dropPointId);
            }
            catch (dbErr) {
                const msg = dbErr.message || '';
                const err = new Error(msg);
                if (msg.includes('FULLY_BOOKED')) {
                    err.message = `Sorry, this trip is now fully booked (${trip.max_capacity} seats occupied).`;
                    err.statusCode = 409;
                    err.code = 'FULLY_BOOKED';
                }
                else if (msg.includes('DUPLICATE_BOOKING')) {
                    err.message = 'You already have a confirmed booking for this trip.';
                    err.statusCode = 409;
                    err.code = 'DUPLICATE_BOOKING';
                }
                else if (msg.includes('STOP_ALREADY_PASSED')) {
                    err.message = 'All available cabs have already passed this pickup point. Please try another pickup point or try again later.';
                    err.statusCode = 400;
                    err.code = 'STOP_ALREADY_PASSED';
                }
                else if (msg.includes('NO_RIDES_REMAINING') || msg.includes('SUBSCRIPTION_EXPIRED')) {
                    err.statusCode = 402;
                    err.code = 'SUBSCRIPTION_ERROR';
                }
                else {
                    err.statusCode = 400;
                }
                throw err;
            }
            const bookingId = atomicResult.booking_id;
            const passId = atomicResult.pass_id;
            const seatNumber = atomicResult.seat_number;
            // 10. Generate and store the definitive dynamic HMAC QR token with the actual pass ID
            const { token: realQrToken, expiresAt: realExpiresAt } = (0, crypto_1.generateDynamicQrToken)(passId, studentId, tripId, trip.route_id, trip.trip_date, 180);
            await supabase
                .from('daily_travel_passes')
                .update({
                qr_code_data: realQrToken,
                qr_expires_at: new Date(realExpiresAt).toISOString(),
                updated_at: new Date().toISOString(),
            })
                .eq('id', passId);
            const { data: createdBooking } = await supabase
                .from('bookings')
                .select('*')
                .eq('id', bookingId)
                .single();
            const { data: createdPass } = await supabase
                .from('daily_travel_passes')
                .select('*')
                .eq('id', passId)
                .single();
            await notificationProvider_1.NotificationProvider.send(studentId, 'Ride Booked Successfully!', `Seat #${seatNumber} confirmed on scheduled trip. Your daily pass is ready.`, 'BOOKING', { bookingId, passId, tripId });
            return {
                booking: { ...(createdBooking || {}), seat_number: seatNumber, trip, pickup_point: pickupPoint, drop_point: dropPoint },
                pass: { ...(createdPass || {}), qr_code_data: realQrToken, trip, pickup_point: pickupPoint, drop_point: dropPoint },
                qrToken: realQrToken,
            };
        }
        finally {
            this.tripLocks.delete(tripId);
            releaseLock();
        }
    }
    /**
     * Cancel booking following plan cancellation rules in Supabase
     */
    static async cancelBooking(bookingId, studentId, reason) {
        const supabase = (0, supabaseClient_1.getSupabaseClient)();
        const { data: booking, error } = await supabase
            .from('bookings')
            .select('*')
            .eq('id', bookingId)
            .maybeSingle();
        if (error || !booking) {
            const err = new Error('Booking not found.');
            err.statusCode = 404;
            err.code = 'BOOKING_NOT_FOUND';
            throw err;
        }
        if (booking.student_id !== studentId) {
            const err = new Error('Unauthorized to cancel this booking.');
            err.statusCode = 403;
            err.code = 'UNAUTHORIZED';
            throw err;
        }
        if (booking.status !== 'CONFIRMED') {
            const err = new Error(`Cannot cancel booking with status: ${booking.status}`);
            err.statusCode = 400;
            err.code = 'INVALID_STATUS';
            throw err;
        }
        // Cancel booking and pass
        await bookingRepository_1.BookingRepository.cancelBooking(bookingId, studentId);
        await supabase
            .from('daily_travel_passes')
            .update({ status: 'CANCELLED', updated_at: new Date().toISOString() })
            .eq('booking_id', bookingId);
        // Decrement trip booked seats
        const trip = await tripRepository_1.TripRepository.findById(booking.trip_id);
        if (trip && (trip.booked_seats || 0) > 0) {
            await tripRepository_1.TripRepository.update(trip.id, {
                booked_seats: trip.booked_seats - 1,
            });
        }
        // Restore ride credit to subscription
        const sub = await subscriptionRepository_1.SubscriptionRepository.findActiveByStudentId(studentId);
        if (sub) {
            await subscriptionRepository_1.SubscriptionRepository.update(sub.id, {
                remaining_rides: (sub.remaining_rides || 0) + 1,
            });
        }
        await notificationProvider_1.NotificationProvider.send(studentId, 'Ride Booking Cancelled', `Booking for ${booking.booking_date} has been cancelled. 1 ride credit refunded.`, 'BOOKING');
    }
}
exports.BookingService = BookingService;
//# sourceMappingURL=bookingService.js.map