import { Booking, DailyTravelPass } from '../types';
export declare class BookingService {
    private static tripLocks;
    /**
     * Concurrency-safe atomic ride booking with Supabase
     */
    static bookRide(studentId: string, tripId: string, pickupPointId: string): Promise<{
        booking: Booking;
        pass: DailyTravelPass;
        qrToken: string;
    }>;
    /**
     * Cancel booking following plan cancellation rules in Supabase
     */
    static cancelBooking(bookingId: string, studentId: string, reason: string): Promise<void>;
}
