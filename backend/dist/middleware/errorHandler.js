"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
const zod_1 = require("zod");
const logger_1 = require("../utils/logger");
const response_1 = require("../utils/response");
const errorCodes_1 = require("../config/errorCodes");
function errorHandler(err, req, res, next) {
    logger_1.logger.error(`Unhandled error at ${req.method} ${req.originalUrl}:`, err);
    // 1. Handle Zod Validation Errors
    if (err instanceof zod_1.ZodError) {
        const formattedErrors = err.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
        }));
        const message = formattedErrors.length > 0
            ? `Validation error: ${formattedErrors.map((e) => `${e.field || 'input'} (${e.message})`).join(', ')}`
            : errorCodes_1.USER_FRIENDLY_ERROR_MESSAGES[errorCodes_1.ERROR_CODES.VALIDATION_ERROR];
        (0, response_1.sendError)(res, message, errorCodes_1.ERROR_CODES.VALIDATION_ERROR, formattedErrors, 400);
        return;
    }
    // 2. Handle Custom App Errors with explicit status code
    if (err.statusCode && typeof err.statusCode === 'number') {
        const code = err.code || errorCodes_1.ERROR_CODES.INTERNAL_ERROR;
        const defaultMsg = errorCodes_1.USER_FRIENDLY_ERROR_MESSAGES[code] || 'Request failed. Please check your parameters and try again.';
        (0, response_1.sendError)(res, err.message || defaultMsg, code, err.details || null, err.statusCode);
        return;
    }
    // 3. Map common database and system errors to user-friendly messages
    const rawMsg = (err.message || '').toString();
    // PostgreSQL / Supabase Unique constraint violation
    if (rawMsg.includes('duplicate key') || rawMsg.includes('23505') || rawMsg.includes('already exists')) {
        (0, response_1.sendError)(res, errorCodes_1.USER_FRIENDLY_ERROR_MESSAGES[errorCodes_1.ERROR_CODES.DUPLICATE_RESOURCE], errorCodes_1.ERROR_CODES.DUPLICATE_RESOURCE, null, 409);
        return;
    }
    // PostgreSQL / Supabase Foreign key violation
    if (rawMsg.includes('violates foreign key constraint') || rawMsg.includes('23503')) {
        if (rawMsg.includes('update or delete on table') || req.method === 'DELETE') {
            (0, response_1.sendError)(res, errorCodes_1.USER_FRIENDLY_ERROR_MESSAGES[errorCodes_1.ERROR_CODES.PROTECTED_RECORD_REFERENCE], errorCodes_1.ERROR_CODES.PROTECTED_RECORD_REFERENCE, null, 409);
            return;
        }
        (0, response_1.sendError)(res, 'The referenced parent entity does not exist or has been removed.', errorCodes_1.ERROR_CODES.VALIDATION_INVALID_DATA, null, 400);
        return;
    }
    // PostgreSQL Invalid UUID or syntax
    if (rawMsg.includes('invalid input syntax for type uuid') || rawMsg.includes('22P02')) {
        (0, response_1.sendError)(res, errorCodes_1.USER_FRIENDLY_ERROR_MESSAGES[errorCodes_1.ERROR_CODES.INVALID_ID_FORMAT], errorCodes_1.ERROR_CODES.INVALID_ID_FORMAT, null, 400);
        return;
    }
    // JWT / Auth errors
    if (rawMsg.includes('jwt expired') || rawMsg.includes('TokenExpiredError')) {
        (0, response_1.sendError)(res, errorCodes_1.USER_FRIENDLY_ERROR_MESSAGES[errorCodes_1.ERROR_CODES.AUTH_SESSION_EXPIRED], errorCodes_1.ERROR_CODES.AUTH_SESSION_EXPIRED, null, 401);
        return;
    }
    if (rawMsg.includes('jwt malformed') || rawMsg.includes('invalid token') || rawMsg.includes('JsonWebTokenError')) {
        (0, response_1.sendError)(res, errorCodes_1.USER_FRIENDLY_ERROR_MESSAGES[errorCodes_1.ERROR_CODES.AUTH_UNAUTHORIZED], errorCodes_1.ERROR_CODES.AUTH_UNAUTHORIZED, null, 401);
        return;
    }
    // Database Connection refused / Network
    if (rawMsg.includes('ECONNREFUSED') || rawMsg.includes('fetch failed') || rawMsg.includes('Database client not initialized')) {
        (0, response_1.sendError)(res, errorCodes_1.USER_FRIENDLY_ERROR_MESSAGES[errorCodes_1.ERROR_CODES.DATABASE_UNAVAILABLE], errorCodes_1.ERROR_CODES.DATABASE_UNAVAILABLE, null, 503);
        return;
    }
    // Default User-Friendly Error
    (0, response_1.sendError)(res, process.env.NODE_ENV === 'production'
        ? errorCodes_1.USER_FRIENDLY_ERROR_MESSAGES[errorCodes_1.ERROR_CODES.SERVER_ERROR]
        : err.message || errorCodes_1.USER_FRIENDLY_ERROR_MESSAGES[errorCodes_1.ERROR_CODES.SERVER_ERROR], errorCodes_1.ERROR_CODES.SERVER_ERROR, null, 500);
}
//# sourceMappingURL=errorHandler.js.map