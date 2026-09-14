import { Request, Response, NextFunction } from 'express';
export declare class AuthController {
    static registerStudent(req: Request, res: Response, next: NextFunction): Promise<void>;
    static login(req: Request, res: Response, next: NextFunction): Promise<void>;
    static requestOtp(req: Request, res: Response, next: NextFunction): Promise<void>;
    static verifyOtp(req: Request, res: Response, next: NextFunction): Promise<void>;
    static me(req: Request, res: Response, next: NextFunction): Promise<void>;
}
