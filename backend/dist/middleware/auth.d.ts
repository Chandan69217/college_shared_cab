import { Request, Response, NextFunction } from 'express';
import { AuthTokenPayload } from '../types';
declare global {
    namespace Express {
        interface Request {
            user?: AuthTokenPayload;
        }
    }
}
export declare function authenticateJwt(req: Request, res: Response, next: NextFunction): void;
