import { Request, Response, NextFunction } from 'express';
export declare class PaymentController {
    static initiateSubscription(req: Request, res: Response, next: NextFunction): Promise<void>;
    static confirmPayment(req: Request, res: Response, next: NextFunction): Promise<void>;
    static getAllPayments(req: Request, res: Response, next: NextFunction): Promise<void>;
}
