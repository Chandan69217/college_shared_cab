import { Request, Response, NextFunction } from 'express';
export declare function auditLog(action: string, resource: string): (req: Request, res: Response, next: NextFunction) => void;
