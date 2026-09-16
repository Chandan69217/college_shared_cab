import { Trip, TripPassenger } from '../types';
export declare class DriverService {
    /**
     * Helper to get current date formatted in IST (Asia/Kolkata)
     */
    static getTodayIST(): string;
    /**
     * Get driver dashboard with active trip, assigned vehicle, today's trips
     */
    static getDriverDashboard(driverId: string): Promise<{
        driver: {
            id: string | undefined;
            full_name: string | undefined;
            phone: string | undefined;
            email: string | undefined;
        };
        profile: import("../types").DriverProfile | null;
        activeTrip: any;
        todayTrips: any[];
        totalTripsToday: number;
    }>;
    /**
     * Get all scheduled trips for driver with tab filtering (TODAY, UPCOMING, COMPLETED, ALL)
     */
    static getScheduledTrips(driverId: string, filter?: string): Promise<{
        trips: any[];
        count: number;
        filter: "COMPLETED" | "ALL" | "TODAY" | "UPCOMING";
        todayDate: string;
        stats: {
            today: number;
            upcoming: number;
            completed: number;
            total: number;
        };
    }>;
    /**
     * Get full details for a single trip
     */
    static getTripDetails(tripId: string, driverId: string): Promise<any>;
    /**
     * Get passengers manifest for a specific trip
     */
    static getTripManifest(tripId: string, driverId: string): Promise<TripPassenger[]>;
    /**
     * Start Trip
     */
    static startTrip(tripId: string, driverId: string): Promise<Trip>;
    /**
     * End Trip
     */
    static endTrip(tripId: string, driverId: string): Promise<Trip>;
    /**
     * Report delay on active trip and broadcast alert to booked students
     */
    static reportDelay(tripId: string, driverId: string, data: {
        delayMinutes: number;
        reason: string;
        currentStopId?: string;
        notes?: string;
    }): Promise<any>;
    /**
     * Update individual passenger manifest status (e.g. NO_SHOW, CANCELLED, BOARDED)
     */
    static updatePassengerStatus(tripId: string, driverId: string, studentId: string, status: 'WAITING' | 'BOARDED' | 'NO_SHOW' | 'CANCELLED', notes?: string): Promise<any>;
}
