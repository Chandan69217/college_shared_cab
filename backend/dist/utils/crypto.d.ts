import { DynamicQrPayload } from '../types';
export declare function hashPassword(plainText: string): Promise<string>;
export declare function comparePassword(plainText: string, hash: string): Promise<boolean>;
export declare function generateDynamicQrToken(passId: string, studentId: string, tripId: string, routeId: string, date: string, ttlMinutes?: number): {
    token: string;
    expiresAt: string;
    payload: DynamicQrPayload;
};
export declare function verifyDynamicQrToken(token: string): {
    isValid: boolean;
    isExpired: boolean;
    payload?: DynamicQrPayload;
    error?: string;
};
export declare function generateTicketNumber(): string;
export declare function generateReceiptNumber(): string;
export declare function generateTransactionId(): string;
