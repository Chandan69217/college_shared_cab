import { Vehicle } from '../types';
export declare class VehicleRepository {
    private static getClient;
    static findAll(collegeId?: string): Promise<Vehicle[]>;
    static findById(id: string): Promise<Vehicle | null>;
    static create(vehicle: Partial<Vehicle>): Promise<Vehicle>;
    static update(id: string, updates: Partial<Vehicle>): Promise<Vehicle>;
    static delete(id: string): Promise<void>;
}
