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

  // 1. Handle Zod Validation Errors
  if (err instanceof ZodError) {
    const formattedErrors = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    const message = formattedErrors.length > 0
      ? `Validation error: ${formattedErrors.map((e) => `${e.field || 'input'} (${e.message})`).join(', ')}`
      : 'Invalid input data. Please check the submitted fields.';

    sendError(res, message, 'VALIDATION_ERROR', formattedErrors, 400);
    return;
  }

  // 2. Handle Custom App Errors with explicit status code
  if (err.statusCode && typeof err.statusCode === 'number') {
    sendError(
      res,
      err.message || 'Request failed. Please check your parameters and try again.',
      err.code || 'APP_ERROR',
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
      'A record with this information already exists in the system.',
      'DUPLICATE_RESOURCE',
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
        'This record cannot be permanently deleted because active operational records (such as trips, bookings, or historical records) are linked to it. Please deactivate or archive it instead.',
        'PROTECTED_RECORD_REFERENCE',
        null,
        409
      );
      return;
    }
    sendError(
      res,
      'The referenced parent entity does not exist or has been removed.',
      'INVALID_REFERENCE',
      null,
      400
    );
    return;
  }

  // PostgreSQL Invalid UUID or syntax
  if (rawMsg.includes('invalid input syntax for type uuid') || rawMsg.includes('22P02')) {
    sendError(
      res,
      'Invalid record identifier format provided.',
      'INVALID_ID_FORMAT',
      null,
      400
    );
    return;
  }

  // Database Connection refused / Network
  if (rawMsg.includes('ECONNREFUSED') || rawMsg.includes('fetch failed') || rawMsg.includes('Database client not initialized')) {
    sendError(
      res,
      'Database service is temporarily unavailable. Please try again in a few moments.',
      'DATABASE_UNAVAILABLE',
      null,
      503
    );
    return;
  }

  // Default User-Friendly Error
  sendError(
    res,
    process.env.NODE_ENV === 'production'
      ? 'An unexpected error occurred while processing your request. Please try again later.'
      : err.message || 'An unexpected error occurred. Please try again later.',
    'INTERNAL_SERVER_ERROR',
    null,
    500
  );
}

