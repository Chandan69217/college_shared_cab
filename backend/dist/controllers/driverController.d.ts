import { Request, Response, NextFunction } from 'express';
export declare class DriverController {
    static getDashboard(req: Request, res: Response, next: NextFunction): Promise<void>;
    static getManifest(req: Request, res: Response, next: NextFunction): Promise<void>;
    static startTrip(req: Request, res: Response, next: NextFunction): Promise<void>;
    static endTrip(req: Request, res: Response, next: NextFunction): Promise<void>;
}
