import { Trip, TripPassenger } from '../types';
export declare class TripRepository {
    private static getClient;
    static findAll(collegeId?: string, date?: string): Promise<Trip[]>;
    /**
     * Synchronize daily scheduled trips (both MORNING_PICKUP and EVENING_DROP) for all active routes on a given date.
     */
    static syncDailyTripsForDate(dateStr?: string, routeId?: string, driverId?: string): Promise<void>;
    static findById(id: string): Promise<Trip | null>;
    static findByDriverId(driverId: string, date: string): Promise<Trip[]>;
    static findAssignedTrips(driverId: string, filter?: 'TODAY' | 'UPCOMING' | 'COMPLETED' | 'ALL'): Promise<any[]>;
    static findTripWithDetails(tripId: string, driverId?: string): Promise<any | null>;
    static getTripPassengers(tripId: string): Promise<TripPassenger[]>;
    static create(trip: Partial<Trip>): Promise<Trip>;
    static update(id: string, updates: Partial<Trip>): Promise<Trip>;
}
