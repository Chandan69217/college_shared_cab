import { Trip, TripPassenger } from '../types';
export declare class TripRepository {
    private static getClient;
    static findAll(collegeId?: string, date?: string): Promise<Trip[]>;
    static findById(id: string): Promise<Trip | null>;
    static findByDriverId(driverId: string, date: string): Promise<Trip[]>;
    static getTripPassengers(tripId: string): Promise<TripPassenger[]>;
    static create(trip: Partial<Trip>): Promise<Trip>;
    static update(id: string, updates: Partial<Trip>): Promise<Trip>;
}
