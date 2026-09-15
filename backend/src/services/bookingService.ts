import { Booking, DailyTravelPass } from '../types';
import { generateDynamicQrToken } from '../utils/crypto';
import { NotificationProvider } from '../integrations/notificationProvider';
import { BookingRepository } from '../repositories/bookingRepository';
import { UserRepository } from '../repositories/userRepository';
import { TripRepository } from '../repositories/tripRepository';
import { SubscriptionRepository } from '../repositories/subscriptionRepository';
import { PickupPointRepository } from '../repositories/pickupPointRepository';
import { getSupabaseClient } from '../database/supabaseClient';

export class BookingService {
  private static tripLocks: Map<string, Promise<void>> = new Map();

  /**
   * Concurrency-safe atomic ride booking with Supabase
   */
  public static async bookRide(
    studentId: string,
    tripId: string,
    pickupPointId: string
  ): Promise<{ booking: Booking; pass: DailyTravelPass; qrToken: string }> {
    while (this.tripLocks.has(tripId)) {
      await this.tripLocks.get(tripId);
    }

    let releaseLock: () => void = () => {};
    const lockPromise = new Promise<void>((resolve) => {
      releaseLock = resolve;
    });
    this.tripLocks.set(tripId, lockPromise);

    try {
      // 1. Verify student profile verification status in Supabase
      const studentProfile = await UserRepository.getStudentProfile(studentId);
      if (!studentProfile || studentProfile.verification_status !== 'VERIFIED') {
        const err: any = new Error(
          'Student account is pending administrative verification. Booking is disabled.'
        );
        err.statusCode = 403;
        err.code = 'STUDENT_NOT_VERIFIED';
        throw err;
      }

      // 2. Verify Trip exists & is scheduled
      const trip = await TripRepository.findById(tripId);
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
      if ((trip.booked_seats || 0) >= trip.max_capacity) {
        const err: any = new Error(
          `FULLY BOOKED: All ${trip.max_capacity} seats on this trip are occupied.`
        );
        err.statusCode = 409;
        err.code = 'FULLY_BOOKED';
        throw err;
      }

      // 4. Verify Active Subscription with remaining rides
      const activeSub = await SubscriptionRepository.findActiveByStudentId(studentId);
      if (!activeSub || (activeSub.remaining_rides || 0) <= 0) {
        const err: any = new Error(
          'No active subscription with available ride credits found. Please purchase a plan.'
        );
        err.statusCode = 402;
        err.code = 'NO_ACTIVE_SUBSCRIPTION';
        throw err;
      }

      // 5. Prevent Duplicate Booking for same trip
      const existingBookings = await BookingRepository.findByStudentId(studentId);
      const isDuplicate = existingBookings.some((b) => b.trip_id === tripId && b.status === 'CONFIRMED');
      if (isDuplicate) {
        const err: any = new Error('You already have a confirmed booking for this trip.');
        err.statusCode = 409;
        err.code = 'DUPLICATE_BOOKING';
        throw err;
      }

      // 6. Validate Pickup Point
      const pickupPoint = await PickupPointRepository.findById(pickupPointId);
      if (!pickupPoint || !pickupPoint.is_active || !pickupPoint.is_approved) {
        const err: any = new Error('Invalid or unapproved pickup point.');
        err.statusCode = 400;
        err.code = 'INVALID_PICKUP_POINT';
        throw err;
      }

      // 7. Deduct ride credit from Subscription in Supabase
      await SubscriptionRepository.update(activeSub.id, {
        remaining_rides: activeSub.remaining_rides - 1,
      });

      // 8. Increment trip booked seats in Supabase
      const seatNumber = (trip.booked_seats || 0) + 1;
      await TripRepository.update(tripId, {
        booked_seats: seatNumber,
      });

      // 9. Create Booking record in Supabase
      const supabase = getSupabaseClient()!;
      const { data: createdBooking, error: bkErr } = await supabase
        .from('bookings')
        .insert([{
          student_id: studentId,
          subscription_id: activeSub.id,
          trip_id: tripId,
          route_id: trip.route_id,
          pickup_point_id: pickupPointId,
          booking_date: trip.trip_date,
          trip_type: trip.trip_type,
          seat_number: seatNumber,
          status: 'CONFIRMED',
        }])
        .select('*')
        .single();

      if (bkErr) throw new Error(`Booking creation error: ${bkErr.message}`);

      // 10. Generate Dynamic HMAC QR token and Travel Pass in Supabase
      const { token: qrToken, expiresAt } = generateDynamicQrToken(
        createdBooking.id,
        studentId,
        tripId,
        trip.route_id,
        trip.trip_date,
        180
      );

      const { data: createdPass, error: psErr } = await supabase
        .from('daily_travel_passes')
        .insert([{
          student_id: studentId,
          booking_id: createdBooking.id,
          trip_id: tripId,
          pass_date: trip.trip_date,
          trip_type: trip.trip_type,
          route_id: trip.route_id,
          pickup_point_id: pickupPointId,
          auth_token_hash: qrToken,
          valid_until: expiresAt,
          status: 'ACTIVE',
        }])
        .select('*')
        .single();

      if (psErr) throw new Error(`Pass generation error: ${psErr.message}`);

      // 11. Add to Passenger Manifest in Supabase
      await supabase.from('trip_passengers').insert([{
        trip_id: tripId,
        booking_id: createdBooking.id,
        student_id: studentId,
        pickup_point_id: pickupPointId,
        seat_number: seatNumber,
        status: 'WAITING',
      }]);

      await NotificationProvider.send(
        studentId,
        'Ride Booked Successfully!',
        `Seat #${seatNumber} confirmed on scheduled trip. Your daily pass is ready.`,
        'BOOKING',
        { bookingId: createdBooking.id, passId: createdPass.id, tripId }
      );

      return {
        booking: { ...createdBooking, trip, pickup_point: pickupPoint } as Booking,
        pass: { ...createdPass, trip, pickup_point: pickupPoint } as DailyTravelPass,
        qrToken,
      };
    } finally {
      this.tripLocks.delete(tripId);
      releaseLock();
    }
  }

  /**
   * Cancel booking following plan cancellation rules in Supabase
   */
  public static async cancelBooking(
    bookingId: string,
    studentId: string,
    reason: string
  ): Promise<void> {
    const supabase = getSupabaseClient()!;
    const { data: booking, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .maybeSingle();

    if (error || !booking) {
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

    // Cancel booking and pass
    await BookingRepository.cancelBooking(bookingId, studentId);
    await supabase
      .from('daily_travel_passes')
      .update({ status: 'CANCELLED', updated_at: new Date().toISOString() })
      .eq('booking_id', bookingId);

    // Decrement trip booked seats
    const trip = await TripRepository.findById(booking.trip_id);
    if (trip && (trip.booked_seats || 0) > 0) {
      await TripRepository.update(trip.id, {
        booked_seats: trip.booked_seats - 1,
      });
    }

    // Restore ride credit to subscription
    const sub = await SubscriptionRepository.findActiveByStudentId(studentId);
    if (sub) {
      await SubscriptionRepository.update(sub.id, {
        remaining_rides: (sub.remaining_rides || 0) + 1,
      });
    }

    await NotificationProvider.send(
      studentId,
      'Ride Booking Cancelled',
      `Booking for ${booking.booking_date} has been cancelled. 1 ride credit refunded.`,
      'BOOKING'
    );
  }
}
