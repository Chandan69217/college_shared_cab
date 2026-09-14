"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendSuccess = sendSuccess;
exports.sendError = sendError;
function sendSuccess(res, message, data = null, statusCode = 200) {
    const responsePayload = {
        success: true,
        message,
        data,
        error: null,
    };
    return res.status(statusCode).json(responsePayload);
}
function sendError(res, message, code = 'INTERNAL_ERROR', details = null, statusCode = 500) {
    const responsePayload = {
        success: false,
        message,
        data: null,
        error: {
            code,
            details,
        },
    };
    return res.status(statusCode).json(responsePayload);
}
//# sourceMappingURL=response.js.map