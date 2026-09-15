import { PickupPoint } from '../types';
export declare class PickupPointRepository {
    private static getClient;
    static findAll(collegeId?: string): Promise<PickupPoint[]>;
    static findById(id: string): Promise<PickupPoint | null>;
    static create(point: Partial<PickupPoint>): Promise<PickupPoint>;
    static update(id: string, updates: Partial<PickupPoint>): Promise<PickupPoint>;
    static delete(id: string): Promise<void>;
}
