export declare class OtpService {
    private static otpStore;
    private static readonly OTP_EXPIRY_MS;
    private static readonly RESEND_COOLDOWN_MS;
    private static readonly MAX_ATTEMPTS;
    private static hashOtp;
    /**
     * Generates a secure 6-digit random OTP and dispatches it to BOTH Email & SMS simultaneously
     */
    static generateAndSendOtp(identifier: string, purpose?: string, userId?: string, userEmail?: string, userPhone?: string, userName?: string, role?: string): Promise<{
        message: string;
        cooldownSeconds: number;
    }>;
    /**
     * Verifies the provided 6-digit OTP against the secure hash and enforces role isolation
     */
    static verifyOtp(identifier: string, plainOtp: string, purpose?: string, expectedRole?: string): Promise<{
        resetToken: string;
    }>;
    /**
     * Validates the single-use reset token before updating password
     */
    static verifyResetToken(identifier: string, token: string, expectedRole?: string): boolean;
    private static cleanupRecord;
}
