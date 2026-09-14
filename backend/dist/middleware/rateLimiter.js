"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRateLimiter = exports.apiRateLimiter = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const response_1 = require("../utils/response");
exports.apiRateLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 300, // max 300 requests per window
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        (0, response_1.sendError)(res, 'Too many requests from this IP. Please try again later.', 'RATE_LIMIT_EXCEEDED', null, 429);
    },
});
exports.authRateLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 30, // 30 attempts per 15 mins for login / OTP
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        (0, response_1.sendError)(res, 'Too many login attempts. Please try again after 15 minutes.', 'AUTH_RATE_LIMIT_EXCEEDED', null, 429);
    },
});
//# sourceMappingURL=rateLimiter.js.map