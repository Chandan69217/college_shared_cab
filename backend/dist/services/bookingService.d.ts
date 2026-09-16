import { Booking, DailyTravelPass } from '../types';
export declare class BookingService {
    private static tripLocks;
    /**
     * Check route, stop validity and live cab availability before booking
     */
    static checkAvailability(studentId: string, routeId: string, pickupPointId: string, dropPointId?: string): Promise<{
        available: boolean;
        reason: string;
        message: string;
        trips: any[];
        availableTrips?: undefined;
    } | {
        available: boolean;
        reason: string;
        message: string;
        trips: any[];
        availableTrips: any[];
    }>;
    /**
     * Concurrency-safe atomic ride booking with Supabase
     */
    static bookRide(studentId: string, tripId: string, pickupPointId: string, dropPointId?: string): Promise<{
        booking: Booking;
        pass: DailyTravelPass;
        qrToken: string;
    }>;
    /**
     * Cancel booking following plan cancellation rules in Supabase
     */
    static cancelBooking(bookingId: string, studentId: string, reason: string): Promise<void>;
}
