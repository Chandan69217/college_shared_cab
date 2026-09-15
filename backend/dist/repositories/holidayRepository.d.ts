import { CollegeHoliday } from '../types';
export declare class HolidayRepository {
    private static getClient;
    static findAll(collegeId?: string): Promise<CollegeHoliday[]>;
    static create(holiday: Partial<CollegeHoliday>): Promise<CollegeHoliday>;
    static delete(id: string): Promise<void>;
}
