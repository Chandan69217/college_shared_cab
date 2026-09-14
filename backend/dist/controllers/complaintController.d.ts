import { Request, Response, NextFunction } from 'express';
export declare class ComplaintController {
    static createComplaint(req: Request, res: Response, next: NextFunction): Promise<void>;
    static replyComplaint(req: Request, res: Response, next: NextFunction): Promise<void>;
    static getStudentComplaints(req: Request, res: Response, next: NextFunction): Promise<void>;
    static getAllComplaints(req: Request, res: Response, next: NextFunction): Promise<void>;
    static rateTrip(req: Request, res: Response, next: NextFunction): Promise<void>;
}
