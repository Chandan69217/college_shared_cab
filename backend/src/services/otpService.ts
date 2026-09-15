import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { ENV } from '../config/env';
import { NotificationProvider } from '../integrations/notificationProvider';
import { CommunicationService } from './communicationService';
import { logger } from '../utils/logger';

interface OtpRecord {
  identifier: string; // primary requested key
  email?: string;
  phone?: string;
  role?: string;
  otpHash: string;
  purpose: string;
  expiresAt: number;
  attempts: number;
  maxAttempts: number;
  createdAt: number;
  lastRequestedAt: number;
}

export class OtpService {
  private static otpStore: Map<string, OtpRecord> = new Map();
  private static readonly OTP_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes
  private static readonly RESEND_COOLDOWN_MS = 60 * 1000; // 60 seconds
  private static readonly MAX_ATTEMPTS = 5;

  private static hashOtp(otp: string): string {
    return crypto.createHash('sha256').update(otp.trim()).digest('hex');
  }

  /**
   * Generates a secure 6-digit random OTP and dispatches it to BOTH Email & SMS simultaneously
   */
  public static async generateAndSendOtp(
    identifier: string,
    purpose: string = 'PASSWORD_RESET',
    userId?: string,
    userEmail?: string,
    userPhone?: string,
    userName?: string,
    role?: string
  ): Promise<{ message: string; cooldownSeconds: number }> {
    const key = identifier.trim().toLowerCase();
    const now = Date.now();

    // Check resend cooldown on primary key or linked email/phone
    const existing =
      this.otpStore.get(key) ||
      (userEmail ? this.otpStore.get(userEmail.trim().toLowerCase()) : undefined) ||
      (userPhone ? this.otpStore.get(userPhone.trim()) : undefined);

    if (existing && existing.purpose === purpose) {
      const elapsed = now - existing.lastRequestedAt;
      if (elapsed < this.RESEND_COOLDOWN_MS) {
        const remainingSeconds = Math.ceil((this.RESEND_COOLDOWN_MS - elapsed) / 1000);
        const err: any = new Error(`Please wait ${remainingSeconds} second(s) before requesting a new OTP.`);
        err.statusCode = 429;
        err.code = 'OTP_RESEND_COOLDOWN_ACTIVE';
        throw err;
      }
    }

    // Generate cryptographically secure 6-digit numeric OTP
    const rawOtp = crypto.randomInt(100000, 999999).toString();
    const otpHash = this.hashOtp(rawOtp);

    const record: OtpRecord = {
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
      CommunicationService.sendOtpEmail(targetEmail, rawOtp, userName || 'Campus Member', purpose).catch(err => {
        logger.error(`Failed to dispatch OTP email: ${err.message}`);
      });
    }

    // 2. Dispatch real SMS
    const targetPhone = userPhone || (!key.includes('@') ? key : undefined);
    if (targetPhone) {
      CommunicationService.sendOtpSms(targetPhone, rawOtp, purpose).catch(err => {
        logger.error(`Failed to dispatch OTP SMS: ${err.message}`);
      });
    }

    // 3. Dispatch in-app push notification if user exists
    if (userId) {
      NotificationProvider.send(
        userId,
        'Security Verification Code',
        `Your CampusRide verification code is ${rawOtp}. Valid for 5 minutes. Do not share this code with anyone.`,
        'GENERAL',
        { purpose }
      ).catch(err => {
        logger.error(`Failed to dispatch notification: ${err.message}`);
      });
    }

    logger.info(`[MULTI-CHANNEL OTP DISPATCH] Generated OTP for ${role || 'USER'}: "${userName || key}" -> Email: ${targetEmail || 'N/A'}, SMS: ${targetPhone || 'N/A'}`);
    if (ENV.NODE_ENV !== 'production') {
      logger.info(`[DEV ONLY - SECURE OTP]: ${rawOtp}`);
    }

    return {
      message: 'A 6-digit verification code has been sent to your registered email address and mobile number.',
      cooldownSeconds: 60,
    };
  }

  /**
   * Verifies the provided 6-digit OTP against the secure hash and enforces role isolation
   */
  public static async verifyOtp(
    identifier: string,
    plainOtp: string,
    purpose: string = 'PASSWORD_RESET',
    expectedRole?: string
  ): Promise<{ resetToken: string }> {
    const key = identifier.trim().toLowerCase();
    const record = this.otpStore.get(key);
    const now = Date.now();

    if (!record || record.purpose !== purpose) {
      const err: any = new Error('No active verification code found for this account. Please request a new OTP.');
      err.statusCode = 400;
      err.code = 'OTP_NOT_FOUND';
      throw err;
    }

    // Enforce role isolation if specified
    if (expectedRole && record.role && record.role !== expectedRole) {
      const err: any = new Error(`This account is registered as a ${record.role}. You cannot recover this account from the ${expectedRole} portal.`);
      err.statusCode = 403;
      err.code = 'ROLE_MISMATCH';
      throw err;
    }

    if (now > record.expiresAt) {
      this.cleanupRecord(record);
      const err: any = new Error('The verification code has expired. Please request a new OTP.');
      err.statusCode = 400;
      err.code = 'OTP_EXPIRED';
      throw err;
    }

    if (record.attempts >= record.maxAttempts) {
      this.cleanupRecord(record);
      const err: any = new Error('Too many incorrect attempts. For security, this OTP has been invalidated. Please request a new one.');
      err.statusCode = 429;
      err.code = 'OTP_MAX_ATTEMPTS_EXCEEDED';
      throw err;
    }

    const providedHash = this.hashOtp(plainOtp);
    if (providedHash !== record.otpHash) {
      record.attempts += 1;
      const remaining = record.maxAttempts - record.attempts;
      const err: any = new Error(
        remaining > 0
          ? `The verification code entered is incorrect. ${remaining} attempt(s) remaining.`
          : 'Too many incorrect attempts. This OTP has been invalidated.'
      );
      err.statusCode = 400;
      err.code = 'INVALID_OTP';
      throw err;
    }

    // Invalidate all associated keys immediately upon successful verification
    this.cleanupRecord(record);

    // Issue single-use short-lived reset token (10 minutes) with role embedding
    const resetToken = jwt.sign(
      {
        identifier: key,
        email: record.email,
        phone: record.phone,
        role: record.role,
        purpose,
        type: 'PASSWORD_RESET_TOKEN',
      },
      ENV.JWT_SECRET,
      { expiresIn: '10m' }
    );

    return { resetToken };
  }

  /**
   * Validates the single-use reset token before updating password
   */
  public static verifyResetToken(identifier: string, token: string, expectedRole?: string): boolean {
    try {
      const decoded = jwt.verify(token, ENV.JWT_SECRET) as any;
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

      if (
        tokenIdentifier === key ||
        tokenEmail === key ||
        tokenPhone === key ||
        (tokenPhone && key.endsWith(tokenPhone.slice(-10)))
      ) {
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  private static cleanupRecord(record: OtpRecord) {
    this.otpStore.delete(record.identifier);
    if (record.email) this.otpStore.delete(record.email);
    if (record.phone) this.otpStore.delete(record.phone);
  }
}
