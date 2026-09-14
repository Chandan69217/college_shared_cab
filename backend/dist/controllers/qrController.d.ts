import { Request, Response, NextFunction } from 'express';
export declare class QrController {
    static getStudentQr(req: Request, res: Response, next: NextFunction): Promise<void>;
    static verifyScan(req: Request, res: Response, next: NextFunction): Promise<void>;
}
