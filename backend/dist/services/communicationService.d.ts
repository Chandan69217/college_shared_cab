export declare class CommunicationService {
    private static emailTransporter;
    /**
     * Initializes or retrieves the configured nodemailer SMTP transporter
     */
    private static getEmailTransporter;
    /**
     * Dispatches OTP email with rich branded HTML template
     */
    static sendOtpEmail(toEmail: string, otp: string, userName?: string, purpose?: string): Promise<boolean>;
    /**
     * Dispatches OTP SMS via Fast2SMS / Twilio / MSG91 or Simulator Gateway
     */
    static sendOtpSms(toPhone: string, otp: string, purpose?: string): Promise<boolean>;
}
