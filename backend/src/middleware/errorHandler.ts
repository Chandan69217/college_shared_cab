import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { logger } from '../utils/logger';
import { sendError } from '../utils/response';
import { ERROR_CODES, USER_FRIENDLY_ERROR_MESSAGES } from '../config/errorCodes';

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  logger.error(`Unhandled error at ${req.method} ${req.originalUrl}:`, err);

  // 1. Handle Zod Validation Errors
  if (err instanceof ZodError) {
    const formattedErrors = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    const message = formattedErrors.length > 0
      ? `Validation error: ${formattedErrors.map((e) => `${e.field || 'input'} (${e.message})`).join(', ')}`
      : USER_FRIENDLY_ERROR_MESSAGES[ERROR_CODES.VALIDATION_ERROR];

    sendError(res, message, ERROR_CODES.VALIDATION_ERROR, formattedErrors, 400);
    return;
  }

  // 2. Handle Custom App Errors with explicit status code
  if (err.statusCode && typeof err.statusCode === 'number') {
    const code = err.code || ERROR_CODES.INTERNAL_ERROR;
    const defaultMsg = USER_FRIENDLY_ERROR_MESSAGES[code] || 'Request failed. Please check your parameters and try again.';
    sendError(
      res,
      err.message || defaultMsg,
      code,
      err.details || null,
      err.statusCode
    );
    return;
  }

  // 3. Map common database and system errors to user-friendly messages
  const rawMsg = (err.message || '').toString();

  // PostgreSQL / Supabase Unique constraint violation
  if (rawMsg.includes('duplicate key') || rawMsg.includes('23505') || rawMsg.includes('already exists')) {
    sendError(
      res,
      USER_FRIENDLY_ERROR_MESSAGES[ERROR_CODES.DUPLICATE_RESOURCE],
      ERROR_CODES.DUPLICATE_RESOURCE,
      null,
      409
    );
    return;
  }

  // PostgreSQL / Supabase Foreign key violation
  if (rawMsg.includes('violates foreign key constraint') || rawMsg.includes('23503')) {
    if (rawMsg.includes('update or delete on table') || req.method === 'DELETE') {
      sendError(
        res,
        USER_FRIENDLY_ERROR_MESSAGES[ERROR_CODES.PROTECTED_RECORD_REFERENCE],
        ERROR_CODES.PROTECTED_RECORD_REFERENCE,
        null,
        409
      );
      return;
    }
    sendError(
      res,
      'The referenced parent entity does not exist or has been removed.',
      ERROR_CODES.VALIDATION_INVALID_DATA,
      null,
      400
    );
    return;
  }

  // PostgreSQL Invalid UUID or syntax
  if (rawMsg.includes('invalid input syntax for type uuid') || rawMsg.includes('22P02')) {
    sendError(
      res,
      USER_FRIENDLY_ERROR_MESSAGES[ERROR_CODES.INVALID_ID_FORMAT],
      ERROR_CODES.INVALID_ID_FORMAT,
      null,
      400
    );
    return;
  }

  // JWT / Auth errors
  if (rawMsg.includes('jwt expired') || rawMsg.includes('TokenExpiredError')) {
    sendError(
      res,
      USER_FRIENDLY_ERROR_MESSAGES[ERROR_CODES.AUTH_SESSION_EXPIRED],
      ERROR_CODES.AUTH_SESSION_EXPIRED,
      null,
      401
    );
    return;
  }

  if (rawMsg.includes('jwt malformed') || rawMsg.includes('invalid token') || rawMsg.includes('JsonWebTokenError')) {
    sendError(
      res,
      USER_FRIENDLY_ERROR_MESSAGES[ERROR_CODES.AUTH_UNAUTHORIZED],
      ERROR_CODES.AUTH_UNAUTHORIZED,
      null,
      401
    );
    return;
  }

  // Database Connection refused / Network
  if (rawMsg.includes('ECONNREFUSED') || rawMsg.includes('fetch failed') || rawMsg.includes('Database client not initialized')) {
    sendError(
      res,
      USER_FRIENDLY_ERROR_MESSAGES[ERROR_CODES.DATABASE_UNAVAILABLE],
      ERROR_CODES.DATABASE_UNAVAILABLE,
      null,
      503
    );
    return;
  }

  // Default User-Friendly Error
  sendError(
    res,
    process.env.NODE_ENV === 'production'
      ? USER_FRIENDLY_ERROR_MESSAGES[ERROR_CODES.SERVER_ERROR]
      : err.message || USER_FRIENDLY_ERROR_MESSAGES[ERROR_CODES.SERVER_ERROR],
    ERROR_CODES.SERVER_ERROR,
    null,
    500
  );
}


