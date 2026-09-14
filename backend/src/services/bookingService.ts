import { db } from '../database/db';
import { Booking, DailyTravelPass } from '../types';
import { generateDynamicQrToken } from '../utils/crypto';
import { NotificationProvider } from '../integrations/notificationProvider';

export class BookingService {
  // Concurrency mutex lock map for trip booking operations
  private static tripLocks: Map<string, Promise<void>> = new Map();

  /**
   * Concurrency-safe atomic ride booking
   */
  public static async bookRide(
    studentId: string,
    tripId: string,
    pickupPointId: string
  ): Promise<{ booking: Booking; pass: DailyTravelPass; qrToken: string }> {
    // Acquire lock for this specific trip to prevent race conditions & overbooking
    while (this.tripLocks.has(tripId)) {
      await this.tripLocks.get(tripId);
    }

    let releaseLock: () => void = () => {};
    const lockPromise = new Promise<void>((resolve) => {
      releaseLock = resolve;
    });
    this.tripLocks.set(tripId, lockPromise);

    try {
      // 1. Verify student profile verification status
      const studentProfile = db.studentProfiles.get(studentId);
      if (!studentProfile || studentProfile.verification_status !== 'VERIFIED') {
        const err: any = new Error(
          'Student account is pending administrative verification. Booking is disabled.'
        );
        err.statusCode = 403;
        err.code = 'STUDENT_NOT_VERIFIED';
        throw err;
      }

      // 2. Verify Trip exists & is scheduled
      const trip = db.trips.get(tripId);
      if (!trip) {
        const err: any = new Error('Selected trip not found.');
        err.statusCode = 404;
        err.code = 'TRIP_NOT_FOUND';
        throw err;
      }

      if (trip.status !== 'SCHEDULED') {
        const err: any = new Error(`Trip is not open for booking (status: ${trip.status}).`);
        err.statusCode = 400;
        err.code = 'TRIP_UNAVAILABLE';
        throw err;
      }

      // 3. Concurrency check: Seat Capacity
      if (trip.booked_seats >= trip.max_capacity) {
        const err: any = new Error(
          `FULLY BOOKED: All ${trip.max_capacity} seats on this trip are occupied.`
        );
        err.statusCode = 409;
        err.code = 'FULLY_BOOKED';
        throw err;
      }

      // 4. Verify Active Subscription with remaining rides
      let activeSub: any = null;
      for (const sub of db.subscriptions.values()) {
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
        const err: any = new Error(
          'No active subscription with available ride credits found. Please purchase a plan.'
        );
        err.statusCode = 402;
        err.code = 'NO_ACTIVE_SUBSCRIPTION';
        throw err;
      }

      // 5. Prevent Duplicate Booking for same trip
      for (const b of db.bookings.values()) {
        if (b.student_id === studentId && b.trip_id === tripId && b.status === 'CONFIRMED') {
          const err: any = new Error('You already have a confirmed booking for this trip.');
          err.statusCode = 409;
          err.code = 'DUPLICATE_BOOKING';
          throw err;
        }
      }

      // 6. Validate Pickup Point belongs to Route
      const route = db.routes.get(trip.route_id);
      if (!route) {
        const err: any = new Error('Route not found.');
        err.statusCode = 404;
        err.code = 'ROUTE_NOT_FOUND';
        throw err;
      }

      const pickupPoint = db.pickupPoints.get(pickupPointId);
      if (!pickupPoint || !pickupPoint.is_active || !pickupPoint.is_approved) {
        const err: any = new Error('Invalid or unapproved pickup point.');
        err.statusCode = 400;
        err.code = 'INVALID_PICKUP_POINT';
        throw err;
      }

      // 7. Deduct ride credit from Subscription
      activeSub.remaining_rides -= 1;
      activeSub.updated_at = new Date().toISOString();
      db.subscriptions.set(activeSub.id, activeSub);

      // 8. Increment trip booked seats atomically
      const seatNumber = trip.booked_seats + 1;
      trip.booked_seats += 1;
      trip.updated_at = new Date().toISOString();
      db.trips.set(tripId, trip);

      // 9. Create Booking record
      const now = new Date().toISOString();
      const bookingId = `book-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const newBooking: Booking = {
        id: bookingId,
        student_id: studentId,
        student: db.users.get(studentId),
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
      db.bookings.set(bookingId, newBooking);

      // 10. Add to Trip Passenger Manifest
      db.tripPassengers.set(`${tripId}_${studentId}`, {
        id: `pax-${bookingId}`,
        trip_id: tripId,
        booking_id: bookingId,
        student_id: studentId,
        student: db.users.get(studentId),
        pickup_point_id: pickupPointId,
        pickup_point: pickupPoint,
        status: 'WAITING',
        created_at: now,
        updated_at: now,
      });

      // 11. Generate Daily Travel Pass with signed dynamic HMAC QR token
      const passId = `pass-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const { token: qrToken, expiresAt } = generateDynamicQrToken(
        passId,
        studentId,
        tripId,
        trip.route_id,
        trip.trip_date,
        180 // Valid for 3 hours around departure
      );

      const newPass: DailyTravelPass = {
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
      db.dailyPasses.set(passId, newPass);

      // 12. Send confirmation notification
      await NotificationProvider.send(
        studentId,
        'Ride Booked Successfully!',
        `Seat #${seatNumber} confirmed on ${route.name} (${pickupPoint.name}). Your daily pass is ready.`,
        'BOOKING',
        { bookingId, passId, tripId }
      );

      return { booking: newBooking, pass: newPass, qrToken };
    } finally {
      this.tripLocks.delete(tripId);
      releaseLock();
    }
  }

  /**
   * Cancel booking following plan cancellation rules
   */
  public static async cancelBooking(
    bookingId: string,
    studentId: string,
    reason: string
  ): Promise<Booking> {
    const booking = db.bookings.get(bookingId);
    if (!booking) {
      const err: any = new Error('Booking not found.');
      err.statusCode = 404;
      err.code = 'BOOKING_NOT_FOUND';
      throw err;
    }

    if (booking.student_id !== studentId) {
      const err: any = new Error('Unauthorized to cancel this booking.');
      err.statusCode = 403;
      err.code = 'UNAUTHORIZED';
      throw err;
    }

    if (booking.status !== 'CONFIRMED') {
      const err: any = new Error(`Cannot cancel booking with status: ${booking.status}`);
      err.statusCode = 400;
      err.code = 'INVALID_STATUS';
      throw err;
    }

    booking.status = 'CANCELLED';
    booking.cancellation_reason = reason;
    booking.cancelled_at = new Date().toISOString();
    booking.updated_at = new Date().toISOString();
    db.bookings.set(bookingId, booking);

    // Cancel daily pass
    for (const [passId, pass] of db.dailyPasses.entries()) {
      if (pass.booking_id === bookingId) {
        pass.status = 'CANCELLED';
        pass.updated_at = new Date().toISOString();
        db.dailyPasses.set(passId, pass);
      }
    }

    // Decrement trip booked seats
    const trip = db.trips.get(booking.trip_id);
    if (trip && trip.booked_seats > 0) {
      trip.booked_seats -= 1;
      db.trips.set(trip.id, trip);
    }

    // Remove from passenger manifest
    db.tripPassengers.delete(`${booking.trip_id}_${studentId}`);

    // Restore ride credit to subscription
    const sub = db.subscriptions.get(booking.subscription_id);
    if (sub) {
      sub.remaining_rides += 1;
      db.subscriptions.set(sub.id, sub);
    }

    await NotificationProvider.send(
      studentId,
      'Ride Booking Cancelled',
      `Booking for ${booking.booking_date} has been cancelled. 1 ride credit has been refunded.`,
      'BOOKING'
    );

    return booking;
  }
}
