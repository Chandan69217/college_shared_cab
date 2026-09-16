import { Request, Response, NextFunction } from 'express';
export declare class StudentController {
    static getDashboard(req: Request, res: Response, next: NextFunction): Promise<void>;
    static getLiveTracking(req: Request, res: Response, next: NextFunction): Promise<void>;
    static submitVerification(req: Request, res: Response, next: NextFunction): Promise<void>;
    static getSubscriptions(req: Request, res: Response, next: NextFunction): Promise<void>;
    static getBookings(req: Request, res: Response, next: NextFunction): Promise<void>;
    static getPasses(req: Request, res: Response, next: NextFunction): Promise<void>;
    static getTodayPass(req: Request, res: Response, next: NextFunction): Promise<void>;
    static getPayments(req: Request, res: Response, next: NextFunction): Promise<void>;
    static triggerSos(req: Request, res: Response, next: NextFunction): Promise<void>;
}
