import { Request, Response, NextFunction } from 'express';
export declare class AdminController {
    static getDashboardStats(req: Request, res: Response, next: NextFunction): Promise<void>;
    static getStudents(req: Request, res: Response, next: NextFunction): Promise<void>;
    static verifyStudent(req: Request, res: Response, next: NextFunction): Promise<void>;
    static getDrivers(req: Request, res: Response, next: NextFunction): Promise<void>;
    static createDriver(req: Request, res: Response, next: NextFunction): Promise<void>;
    static getAuditLogs(req: Request, res: Response, next: NextFunction): Promise<void>;
}
