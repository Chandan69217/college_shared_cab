import { College } from '../types';
export declare class CollegeRepository {
    private static getClient;
    static findAll(): Promise<College[]>;
    static findById(id: string): Promise<College | null>;
    static findByCode(code: string): Promise<College | null>;
    static create(college: Partial<College>): Promise<College>;
    static update(id: string, updates: Partial<College>): Promise<College>;
    static delete(id: string): Promise<void>;
}
