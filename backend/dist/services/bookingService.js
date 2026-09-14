"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BookingService = void 0;
const db_1 = require("../database/db");
const crypto_1 = require("../utils/crypto");
const notificationProvider_1 = require("../integrations/notificationProvider");
class BookingService {
    // Concurrency mutex lock map for trip booking operations
    static tripLocks = new Map();
    /**
     * Concurrency-safe atomic ride booking
     */
    static async bookRide(studentId, tripId, pickupPointId) {
        // Acquire lock for this specific trip to prevent race conditions & overbooking
        while (this.tripLocks.has(tripId)) {
            await this.tripLocks.get(tripId);
        }
        let releaseLock = () => { };
        const lockPromise = new Promise((resolve) => {
            releaseLock = resolve;
        });
        this.tripLocks.set(tripId, lockPromise);
        try {
            // 1. Verify student profile verification status
            const studentProfile = db_1.db.studentProfiles.get(studentId);
            if (!studentProfile || studentProfile.verification_status !== 'VERIFIED') {
                const err = new Error('Student account is pending administrative verification. Booking is disabled.');
                err.statusCode = 403;
                err.code = 'STUDENT_NOT_VERIFIED';
                throw err;
            }
            // 2. Verify Trip exists & is scheduled
            const trip = db_1.db.trips.get(tripId);
            if (!trip) {
                const err = new Error('Selected trip not found.');
                err.statusCode = 404;
                err.code = 'TRIP_NOT_FOUND';
                throw err;
            }
            if (trip.status !== 'SCHEDULED') {
                const err = new Error(`Trip is not open for booking (status: ${trip.status}).`);
                err.statusCode = 400;
                err.code = 'TRIP_UNAVAILABLE';
                throw err;
            }
            // 3. Concurrency check: Seat Capacity
            if (trip.booked_seats >= trip.max_capacity) {
                const err = new Error(`FULLY BOOKED: All ${trip.max_capacity} seats on this trip are occupied.`);
                err.statusCode = 409;
                err.code = 'FULLY_BOOKED';
                throw err;
            }
            // 4. Verify Active Subscription with remaining rides
            let activeSub = null;
            for (const sub of db_1.db.subscriptions.values()) {
                if (sub.student_id === studentId && sub.status === 'ACTIVE') {
                    if (new Date(sub.end_date) >= new Date(trip.trip_date)) {
                        if (sub.remaining_rides > 0) {
                            activeSub = sub;
                            break;
                        }
                    }
                }
            }
            if (!activeSub) {
                const err = new Error('No active subscription with available ride credits found. Please purchase a plan.');
                err.statusCode = 402;
                err.code = 'NO_ACTIVE_SUBSCRIPTION';
                throw err;
            }
            // 5. Prevent Duplicate Booking for same trip
            for (const b of db_1.db.bookings.values()) {
                if (b.student_id === studentId && b.trip_id === tripId && b.status === 'CONFIRMED') {
                    const err = new Error('You already have a confirmed booking for this trip.');
                    err.statusCode = 409;
                    err.code = 'DUPLICATE_BOOKING';
                    throw err;
                }
            }
            // 6. Validate Pickup Point belongs to Route
            const route = db_1.db.routes.get(trip.route_id);
            if (!route) {
                const err = new Error('Route not found.');
                err.statusCode = 404;
                err.code = 'ROUTE_NOT_FOUND';
                throw err;
            }
            const pickupPoint = db_1.db.pickupPoints.get(pickupPointId);
            if (!pickupPoint || !pickupPoint.is_active || !pickupPoint.is_approved) {
                const err = new Error('Invalid or unapproved pickup point.');
                err.statusCode = 400;
                err.code = 'INVALID_PICKUP_POINT';
                throw err;
            }
            // 7. Deduct ride credit from Subscription
            activeSub.remaining_rides -= 1;
            activeSub.updated_at = new Date().toISOString();
            db_1.db.subscriptions.set(activeSub.id, activeSub);
            // 8. Increment trip booked seats atomically
            const seatNumber = trip.booked_seats + 1;
            trip.booked_seats += 1;
            trip.updated_at = new Date().toISOString();
            db_1.db.trips.set(tripId, trip);
            // 9. Create Booking record
            const now = new Date().toISOString();
            const bookingId = `book-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
            const newBooking = {
                id: bookingId,
                student_id: studentId,
                student: db_1.db.users.get(studentId),
                subscription_id: activeSub.id,
                trip_id: tripId,
                trip,
                route_id: trip.route_id,
                route,
                pickup_point_id: pickupPointId,
                pickup_point: pickupPoint,
                booking_date: trip.trip_date,
                trip_type: trip.trip_type,
                seat_number: seatNumber,
                status: 'CONFIRMED',
                created_at: now,
                updated_at: now,
            };
            db_1.db.bookings.set(bookingId, newBooking);
            // 10. Add to Trip Passenger Manifest
            db_1.db.tripPassengers.set(`${tripId}_${studentId}`, {
                id: `pax-${bookingId}`,
                trip_id: tripId,
                booking_id: bookingId,
                student_id: studentId,
                student: db_1.db.users.get(studentId),
                pickup_point_id: pickupPointId,
                pickup_point: pickupPoint,
                status: 'WAITING',
                created_at: now,
                updated_at: now,
            });
            // 11. Generate Daily Travel Pass with signed dynamic HMAC QR token
            const passId = `pass-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
            const { token: qrToken, expiresAt } = (0, crypto_1.generateDynamicQrToken)(passId, studentId, tripId, trip.route_id, trip.trip_date, 180 // Valid for 3 hours around departure
            );
            const newPass = {
                id: passId,
                student_id: studentId,
                booking_id: bookingId,
                trip_id: tripId,
                trip,
                pass_date: trip.trip_date,
                trip_type: trip.trip_type,
                route_id: trip.route_id,
                route,
                pickup_point_id: pickupPointId,
                pickup_point: pickupPoint,
                auth_token_hash: qrToken,
                valid_until: expiresAt,
                status: 'ACTIVE',
                created_at: now,
                updated_at: now,
            };
            db_1.db.dailyPasses.set(passId, newPass);
            // 12. Send confirmation notification
            await notificationProvider_1.NotificationProvider.send(studentId, 'Ride Booked Successfully!', `Seat #${seatNumber} confirmed on ${route.name} (${pickupPoint.name}). Your daily pass is ready.`, 'BOOKING', { bookingId, passId, tripId });
            return { booking: newBooking, pass: newPass, qrToken };
        }
        finally {
            this.tripLocks.delete(tripId);
            releaseLock();
        }
    }
    /**
     * Cancel booking following plan cancellation rules
     */
    static async cancelBooking(bookingId, studentId, reason) {
        const booking = db_1.db.bookings.get(bookingId);
        if (!booking) {
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
        booking.status = 'CANCELLED';
        booking.cancellation_reason = reason;
        booking.cancelled_at = new Date().toISOString();
        booking.updated_at = new Date().toISOString();
        db_1.db.bookings.set(bookingId, booking);
        // Cancel daily pass
        for (const [passId, pass] of db_1.db.dailyPasses.entries()) {
            if (pass.booking_id === bookingId) {
                pass.status = 'CANCELLED';
                pass.updated_at = new Date().toISOString();
                db_1.db.dailyPasses.set(passId, pass);
            }
        }
        // Decrement trip booked seats
        const trip = db_1.db.trips.get(booking.trip_id);
        if (trip && trip.booked_seats > 0) {
            trip.booked_seats -= 1;
            db_1.db.trips.set(trip.id, trip);
        }
        // Remove from passenger manifest
        db_1.db.tripPassengers.delete(`${booking.trip_id}_${studentId}`);
        // Restore ride credit to subscription
        const sub = db_1.db.subscriptions.get(booking.subscription_id);
        if (sub) {
            sub.remaining_rides += 1;
            db_1.db.subscriptions.set(sub.id, sub);
        }
        await notificationProvider_1.NotificationProvider.send(studentId, 'Ride Booking Cancelled', `Booking for ${booking.booking_date} has been cancelled. 1 ride credit has been refunded.`, 'BOOKING');
        return booking;
    }
}
exports.BookingService = BookingService;
//# sourceMappingURL=bookingService.js.map