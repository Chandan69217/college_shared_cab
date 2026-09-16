import { Request, Response, NextFunction } from 'express';
export declare class TripController {
    static getTrips(req: Request, res: Response, next: NextFunction): Promise<void>;
    static createTrip(req: Request, res: Response, next: NextFunction): Promise<void>;
    static startTrip(req: Request, res: Response, next: NextFunction): Promise<void>;
    static endTrip(req: Request, res: Response, next: NextFunction): Promise<void>;
    static updateLocation(req: Request, res: Response, next: NextFunction): Promise<void>;
    static getTripLocation(req: Request, res: Response, next: NextFunction): Promise<void>;
    static getAllActiveLocations(req: Request, res: Response, next: NextFunction): Promise<void>;
    static getTripHistory(req: Request, res: Response, next: NextFunction): Promise<void>;
}
