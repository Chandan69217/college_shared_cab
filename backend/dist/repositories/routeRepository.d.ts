import { Route } from '../types';
export declare class RouteRepository {
    private static getClient;
    static findAll(collegeId?: string): Promise<Route[]>;
    static findById(id: string): Promise<Route | null>;
    static create(route: Partial<Route>, stops?: any[]): Promise<Route>;
    static update(id: string, updates: Partial<Route>, stops?: any[]): Promise<Route>;
    static delete(id: string): Promise<void>;
}
