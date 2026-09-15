"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OtpService = void 0;
const crypto_1 = __importDefault(require("crypto"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../config/env");
const notificationProvider_1 = require("../integrations/notificationProvider");
const communicationService_1 = require("./communicationService");
const logger_1 = require("../utils/logger");
class OtpService {
    static otpStore = new Map();
    static OTP_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes
    static RESEND_COOLDOWN_MS = 60 * 1000; // 60 seconds
    static MAX_ATTEMPTS = 5;
    static hashOtp(otp) {
        return crypto_1.default.createHash('sha256').update(otp.trim()).digest('hex');
    }
    /**
     * Generates a secure 6-digit random OTP and dispatches it to BOTH Email & SMS simultaneously
     */
    static async generateAndSendOtp(identifier, purpose = 'PASSWORD_RESET', userId, userEmail, userPhone, userName, role) {
        const key = identifier.trim().toLowerCase();
        const now = Date.now();
        // Check resend cooldown on primary key or linked email/phone
        const existing = this.otpStore.get(key) ||
            (userEmail ? this.otpStore.get(userEmail.trim().toLowerCase()) : undefined) ||
            (userPhone ? this.otpStore.get(userPhone.trim()) : undefined);
        if (existing && existing.purpose === purpose) {
            const elapsed = now - existing.lastRequestedAt;
            if (elapsed < this.RESEND_COOLDOWN_MS) {
                const remainingSeconds = Math.ceil((this.RESEND_COOLDOWN_MS - elapsed) / 1000);
                const err = new Error(`Please wait ${remainingSeconds} second(s) before requesting a new OTP.`);
                err.statusCode = 429;
                err.code = 'OTP_RESEND_COOLDOWN_ACTIVE';
                throw err;
            }
        }
        // Generate cryptographically secure 6-digit numeric OTP
        const rawOtp = crypto_1.default.randomInt(100000, 999999).toString();
        const otpHash = this.hashOtp(rawOtp);
        const record = {
            identifier: key,
            email: userEmail?.trim().toLowerCase(),
            phone: userPhone?.trim(),
            role: role || undefined,
            otpHash,
            purpose,
            expiresAt: now + this.OTP_EXPIRY_MS,
            attempts: 0,
            maxAttempts: this.MAX_ATTEMPTS,
            createdAt: now,
            lastRequestedAt: now,
        };
        // Store under primary key as well as both email and phone for cross-lookup
        this.otpStore.set(key, record);
        if (userEmail) {
            this.otpStore.set(userEmail.trim().toLowerCase(), record);
        }
        if (userPhone) {
            this.otpStore.set(userPhone.trim(), record);
        }
        // 1. Dispatch real Email
        const targetEmail = userEmail || (key.includes('@') ? key : undefined);
        if (targetEmail) {
            communicationService_1.CommunicationService.sendOtpEmail(targetEmail, rawOtp, userName || 'Campus Member', purpose).catch(err => {
                logger_1.logger.error(`Failed to dispatch OTP email: ${err.message}`);
            });
        }
        // 2. Dispatch real SMS
        const targetPhone = userPhone || (!key.includes('@') ? key : undefined);
        if (targetPhone) {
            communicationService_1.CommunicationService.sendOtpSms(targetPhone, rawOtp, purpose).catch(err => {
                logger_1.logger.error(`Failed to dispatch OTP SMS: ${err.message}`);
            });
        }
        // 3. Dispatch in-app push notification if user exists
        if (userId) {
            notificationProvider_1.NotificationProvider.send(userId, 'Security Verification Code', `Your CampusRide verification code is ${rawOtp}. Valid for 5 minutes. Do not share this code with anyone.`, 'GENERAL', { purpose }).catch(err => {
                logger_1.logger.error(`Failed to dispatch notification: ${err.message}`);
            });
        }
        logger_1.logger.info(`[MULTI-CHANNEL OTP DISPATCH] Generated OTP for ${role || 'USER'}: "${userName || key}" -> Email: ${targetEmail || 'N/A'}, SMS: ${targetPhone || 'N/A'}`);
        if (env_1.ENV.NODE_ENV !== 'production') {
            logger_1.logger.info(`[DEV ONLY - SECURE OTP]: ${rawOtp}`);
        }
        return {
            message: 'A 6-digit verification code has been sent to your registered email address and mobile number.',
            cooldownSeconds: 60,
        };
    }
    /**
     * Verifies the provided 6-digit OTP against the secure hash and enforces role isolation
     */
    static async verifyOtp(identifier, plainOtp, purpose = 'PASSWORD_RESET', expectedRole) {
        const key = identifier.trim().toLowerCase();
        const record = this.otpStore.get(key);
        const now = Date.now();
        if (!record || record.purpose !== purpose) {
            const err = new Error('No active verification code found for this account. Please request a new OTP.');
            err.statusCode = 400;
            err.code = 'OTP_NOT_FOUND';
            throw err;
        }
        // Enforce role isolation if specified
        if (expectedRole && record.role && record.role !== expectedRole) {
            const err = new Error(`This account is registered as a ${record.role}. You cannot recover this account from the ${expectedRole} portal.`);
            err.statusCode = 403;
            err.code = 'ROLE_MISMATCH';
            throw err;
        }
        if (now > record.expiresAt) {
            this.cleanupRecord(record);
            const err = new Error('The verification code has expired. Please request a new OTP.');
            err.statusCode = 400;
            err.code = 'OTP_EXPIRED';
            throw err;
        }
        if (record.attempts >= record.maxAttempts) {
            this.cleanupRecord(record);
            const err = new Error('Too many incorrect attempts. For security, this OTP has been invalidated. Please request a new one.');
            err.statusCode = 429;
            err.code = 'OTP_MAX_ATTEMPTS_EXCEEDED';
            throw err;
        }
        const providedHash = this.hashOtp(plainOtp);
        if (providedHash !== record.otpHash) {
            record.attempts += 1;
            const remaining = record.maxAttempts - record.attempts;
            const err = new Error(remaining > 0
                ? `The verification code entered is incorrect. ${remaining} attempt(s) remaining.`
                : 'Too many incorrect attempts. This OTP has been invalidated.');
            err.statusCode = 400;
            err.code = 'INVALID_OTP';
            throw err;
        }
        // Invalidate all associated keys immediately upon successful verification
        this.cleanupRecord(record);
        // Issue single-use short-lived reset token (10 minutes) with role embedding
        const resetToken = jsonwebtoken_1.default.sign({
            identifier: key,
            email: record.email,
            phone: record.phone,
            role: record.role,
            purpose,
            type: 'PASSWORD_RESET_TOKEN',
        }, env_1.ENV.JWT_SECRET, { expiresIn: '10m' });
        return { resetToken };
    }
    /**
     * Validates the single-use reset token before updating password
     */
    static verifyResetToken(identifier, token, expectedRole) {
        try {
            const decoded = jsonwebtoken_1.default.verify(token, env_1.ENV.JWT_SECRET);
            if (decoded.type !== 'PASSWORD_RESET_TOKEN') {
                return false;
            }
            if (expectedRole && decoded.role && decoded.role !== expectedRole) {
                return false;
            }
            const key = identifier.trim().toLowerCase();
            const tokenIdentifier = (decoded.identifier || '').toLowerCase();
            const tokenEmail = (decoded.email || '').toLowerCase();
            const tokenPhone = (decoded.phone || '').trim();
            if (tokenIdentifier === key ||
                tokenEmail === key ||
                tokenPhone === key ||
                (tokenPhone && key.endsWith(tokenPhone.slice(-10)))) {
                return true;
            }
            return false;
        }
        catch {
            return false;
        }
    }
    static cleanupRecord(record) {
        this.otpStore.delete(record.identifier);
        if (record.email)
            this.otpStore.delete(record.email);
        if (record.phone)
            this.otpStore.delete(record.phone);
    }
}
exports.OtpService = OtpService;
//# sourceMappingURL=otpService.js.map