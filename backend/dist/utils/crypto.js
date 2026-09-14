"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.hashPassword = hashPassword;
exports.comparePassword = comparePassword;
exports.generateDynamicQrToken = generateDynamicQrToken;
exports.verifyDynamicQrToken = verifyDynamicQrToken;
exports.generateTicketNumber = generateTicketNumber;
exports.generateReceiptNumber = generateReceiptNumber;
exports.generateTransactionId = generateTransactionId;
const crypto_1 = __importDefault(require("crypto"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const env_1 = require("../config/env");
async function hashPassword(plainText) {
    const salt = await bcryptjs_1.default.genSalt(10);
    return bcryptjs_1.default.hash(plainText, salt);
}
async function comparePassword(plainText, hash) {
    return bcryptjs_1.default.compare(plainText, hash);
}
function generateDynamicQrToken(passId, studentId, tripId, routeId, date, ttlMinutes = 30) {
    const exp = Math.floor(Date.now() / 1000) + ttlMinutes * 60;
    const rawData = `${passId}:${studentId}:${tripId}:${routeId}:${date}:${exp}`;
    const hmac = crypto_1.default.createHmac('sha256', env_1.ENV.QR_HMAC_SECRET);
    hmac.update(rawData);
    const sig = hmac.digest('hex');
    const payload = {
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
function verifyDynamicQrToken(token) {
    try {
        const jsonStr = Buffer.from(token, 'base64url').toString('utf8');
        const payload = JSON.parse(jsonStr);
        if (!payload.passId || !payload.studentId || !payload.tripId || !payload.sig || !payload.exp) {
            return { isValid: false, isExpired: false, error: 'MALFORMED_PAYLOAD' };
        }
        const now = Math.floor(Date.now() / 1000);
        if (payload.exp < now) {
            return { isValid: false, isExpired: true, payload, error: 'TOKEN_EXPIRED' };
        }
        const rawData = `${payload.passId}:${payload.studentId}:${payload.tripId}:${payload.routeId}:${payload.date}:${payload.exp}`;
        const hmac = crypto_1.default.createHmac('sha256', env_1.ENV.QR_HMAC_SECRET);
        hmac.update(rawData);
        const expectedSig = hmac.digest('hex');
        if (!crypto_1.default.timingSafeEqual(Buffer.from(payload.sig), Buffer.from(expectedSig))) {
            return { isValid: false, isExpired: false, error: 'INVALID_SIGNATURE' };
        }
        return { isValid: true, isExpired: false, payload };
    }
    catch (err) {
        return { isValid: false, isExpired: false, error: 'DECODE_ERROR' };
    }
}
function generateTicketNumber() {
    const randomPart = Math.floor(1000 + Math.random() * 9000);
    const year = new Date().getFullYear();
    return `TKT-${year}-${randomPart}`;
}
function generateReceiptNumber() {
    const randomPart = Math.floor(100000 + Math.random() * 900000);
    const year = new Date().getFullYear();
    return `RCPT-${year}-${randomPart}`;
}
function generateTransactionId() {
    return `TXN-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
}
//# sourceMappingURL=crypto.js.map