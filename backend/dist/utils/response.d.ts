import { Response } from 'express';
export declare function sendSuccess<T>(res: Response, message: string, data?: T | null, statusCode?: number): Response;
export declare function sendError(res: Response, message: string, code?: string, details?: any, statusCode?: number): Response;
