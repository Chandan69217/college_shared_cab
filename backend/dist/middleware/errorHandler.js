"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
const zod_1 = require("zod");
const logger_1 = require("../utils/logger");
const response_1 = require("../utils/response");
function errorHandler(err, req, res, next) {
    logger_1.logger.error(`Unhandled error at ${req.method} ${req.originalUrl}:`, err);
    // Handle Zod Validation Errors
    if (err instanceof zod_1.ZodError) {
        const formattedErrors = err.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
        }));
        (0, response_1.sendError)(res, 'Request validation failed.', 'VALIDATION_ERROR', formattedErrors, 400);
        return;
    }
    // Handle Custom App Errors
    if (err.statusCode && err.code) {
        (0, response_1.sendError)(res, err.message, err.code, err.details || null, err.statusCode);
        return;
    }
    // Default Internal Server Error
    (0, response_1.sendError)(res, process.env.NODE_ENV === 'production'
        ? 'An unexpected error occurred. Please try again later.'
        : err.message || 'Internal server error.', 'INTERNAL_SERVER_ERROR', null, 500);
}
//# sourceMappingURL=errorHandler.js.map