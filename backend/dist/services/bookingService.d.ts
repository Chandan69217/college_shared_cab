import { Booking, DailyTravelPass } from '../types';
export declare class BookingService {
    private static tripLocks;
    /**
     * Concurrency-safe atomic ride booking
     */
    static bookRide(studentId: string, tripId: string, pickupPointId: string): Promise<{
        booking: Booking;
        pass: DailyTravelPass;
        qrToken: string;
    }>;
    /**
     * Cancel booking following plan cancellation rules
     */
    static cancelBooking(bookingId: string, studentId: string, reason: string): Promise<Booking>;
}
