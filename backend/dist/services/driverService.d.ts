import { Trip, TripPassenger } from '../types';
export declare class DriverService {
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
        profile: import("../types").DriverProfile | undefined;
        activeTrip: any;
        todayTrips: Trip[];
        totalTripsToday: number;
    }>;
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
}
