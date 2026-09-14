import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { logger } from '../utils/logger';
import { sendError } from '../utils/response';

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  logger.error(`Unhandled error at ${req.method} ${req.originalUrl}:`, err);

  // Handle Zod Validation Errors
  if (err instanceof ZodError) {
    const formattedErrors = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    sendError(res, 'Request validation failed.', 'VALIDATION_ERROR', formattedErrors, 400);
    return;
  }

  // Handle Custom App Errors
  if (err.statusCode && err.code) {
    sendError(res, err.message, err.code, err.details || null, err.statusCode);
    return;
  }

  // Default Internal Server Error
  sendError(
    res,
    process.env.NODE_ENV === 'production'
      ? 'An unexpected error occurred. Please try again later.'
      : err.message || 'Internal server error.',
    'INTERNAL_SERVER_ERROR',
    null,
    500
  );
}
