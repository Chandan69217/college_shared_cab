import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { ENV } from '../config/env';
import { DynamicQrPayload } from '../types';

export async function hashPassword(plainText: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(plainText, salt);
}

export async function comparePassword(plainText: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plainText, hash);
}

export function generateDynamicQrToken(
  passId: string,
  studentId: string,
  tripId: string,
  routeId: string,
  date: string,
  ttlMinutes = 30
): { token: string; expiresAt: string; payload: DynamicQrPayload } {
  const exp = Math.floor(Date.now() / 1000) + ttlMinutes * 60;
  const rawData = `${passId}:${studentId}:${tripId}:${routeId}:${date}:${exp}`;
  
  const hmac = crypto.createHmac('sha256', ENV.QR_HMAC_SECRET);
  hmac.update(rawData);
  const sig = hmac.digest('hex');

  const payload: DynamicQrPayload = {
    passId,
    studentId,
    tripId,
    routeId,
    date,
    exp,
    sig,
  };

  const token = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const expiresAt = new Date(exp * 1000).toISOString();

  return { token, expiresAt, payload };
}

export function verifyDynamicQrToken(token: string): {
  isValid: boolean;
  isExpired: boolean;
  payload?: DynamicQrPayload;
  error?: string;
} {
  try {
    const jsonStr = Buffer.from(token, 'base64url').toString('utf8');
    const payload: DynamicQrPayload = JSON.parse(jsonStr);

    if (!payload.passId || !payload.studentId || !payload.tripId || !payload.sig || !payload.exp) {
      return { isValid: false, isExpired: false, error: 'MALFORMED_PAYLOAD' };
    }

    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now) {
      return { isValid: false, isExpired: true, payload, error: 'TOKEN_EXPIRED' };
    }

    const rawData = `${payload.passId}:${payload.studentId}:${payload.tripId}:${payload.routeId}:${payload.date}:${payload.exp}`;
    const hmac = crypto.createHmac('sha256', ENV.QR_HMAC_SECRET);
    hmac.update(rawData);
    const expectedSig = hmac.digest('hex');

    if (!crypto.timingSafeEqual(Buffer.from(payload.sig), Buffer.from(expectedSig))) {
      return { isValid: false, isExpired: false, error: 'INVALID_SIGNATURE' };
    }

    return { isValid: true, isExpired: false, payload };
  } catch (err: any) {
    return { isValid: false, isExpired: false, error: 'DECODE_ERROR' };
  }
}

export function generateTicketNumber(): string {
  const randomPart = Math.floor(1000 + Math.random() * 9000);
  const year = new Date().getFullYear();
  return `TKT-${year}-${randomPart}`;
}

export function generateReceiptNumber(): string {
  const randomPart = Math.floor(100000 + Math.random() * 900000);
  const year = new Date().getFullYear();
  return `RCPT-${year}-${randomPart}`;
}

export function generateTransactionId(): string {
  return `TXN-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
}
