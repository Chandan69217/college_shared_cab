import { DailyTravelPass } from '../types';
export interface QrVerificationResponse {
    authorized: boolean;
    status: 'AUTHORIZED' | 'NOT_AUTHORIZED';
    reason?: string;
    message: string;
    student?: {
        id: string;
        full_name: string;
        phone: string;
        course: string;
        student_id_number: string;
    };
    pickupPoint?: {
        name: string;
        address: string;
    };
    scannedAt: string;
}
export declare class QrPassService {
    /**
     * Generates a fresh dynamic signed QR token for a student's active daily pass
     */
    static getDynamicQrForStudent(studentId: string, passId: string): Promise<{
        pass: DailyTravelPass;
        qrToken: string;
        expiresAt: string;
    }>;
    /**
     * Driver QR Scan Verification & Boarding Processor
     */
    static verifyAndBoard(driverId: string, tripId: string, token: string, clientLat?: number, clientLng?: number): Promise<QrVerificationResponse>;
    private static logScan;
}
