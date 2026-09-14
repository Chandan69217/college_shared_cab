import rateLimit from 'express-rate-limit';
import { sendError } from '../utils/response';

export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // max 300 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    sendError(
      res,
      'Too many requests from this IP. Please try again later.',
      'RATE_LIMIT_EXCEEDED',
      null,
      429
    );
  },
});

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30, // 30 attempts per 15 mins for login / OTP
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    sendError(
      res,
      'Too many login attempts. Please try again after 15 minutes.',
      'AUTH_RATE_LIMIT_EXCEEDED',
      null,
      429
    );
  },
});
