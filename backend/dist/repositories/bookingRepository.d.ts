import { Booking, DailyTravelPass } from '../types';
export declare class BookingRepository {
    private static getClient;
    static findAll(date?: string): Promise<Booking[]>;
    static findByStudentId(studentId: string): Promise<Booking[]>;
    static findTodayBooking(studentId: string, todayDate: string): Promise<Booking | null>;
    static findDailyPass(bookingId: string): Promise<DailyTravelPass | null>;
    static findActivePassByStudent(studentId: string): Promise<DailyTravelPass | null>;
    static findPassByTokenHash(tokenHash: string): Promise<DailyTravelPass | null>;
    static updatePass(id: string, updates: Partial<DailyTravelPass>): Promise<DailyTravelPass>;
    static bookTripAtomic(studentId: string, tripId: string, pickupPointId: string, tokenHash: string, validUntil: Date): Promise<any>;
    static cancelBooking(bookingId: string, studentId: string): Promise<void>;
}
