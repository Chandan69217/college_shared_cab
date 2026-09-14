import { Request, Response, NextFunction } from 'express';
export declare class HolidayController {
    static getHolidays(req: Request, res: Response, next: NextFunction): Promise<void>;
    static createHoliday(req: Request, res: Response, next: NextFunction): Promise<void>;
}
