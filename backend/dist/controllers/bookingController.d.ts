import { Request, Response, NextFunction } from 'express';
export declare class BookingController {
    static checkAvailability(req: Request, res: Response, next: NextFunction): Promise<void>;
    static bookRide(req: Request, res: Response, next: NextFunction): Promise<void>;
    static cancelBooking(req: Request, res: Response, next: NextFunction): Promise<void>;
    static getAllBookings(req: Request, res: Response, next: NextFunction): Promise<void>;
}
