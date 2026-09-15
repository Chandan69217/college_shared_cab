"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommunicationService = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const https_1 = __importDefault(require("https"));
const env_1 = require("../config/env");
const logger_1 = require("../utils/logger");
class CommunicationService {
    static emailTransporter = null;
    /**
     * Initializes or retrieves the configured nodemailer SMTP transporter
     */
    static getEmailTransporter() {
        if (!this.emailTransporter) {
            if (env_1.ENV.SMTP_USER && env_1.ENV.SMTP_PASS) {
                this.emailTransporter = nodemailer_1.default.createTransport({
                    host: env_1.ENV.SMTP_HOST,
                    port: env_1.ENV.SMTP_PORT,
                    secure: env_1.ENV.SMTP_SECURE,
                    auth: {
                        user: env_1.ENV.SMTP_USER,
                        pass: env_1.ENV.SMTP_PASS,
                    },
                });
            }
            else {
                // Create standard JSON/logging transport for development fallback
                this.emailTransporter = nodemailer_1.default.createTransport({
                    jsonTransport: true,
                });
            }
        }
        return this.emailTransporter;
    }
    /**
     * Dispatches OTP email with rich branded HTML template
     */
    static async sendOtpEmail(toEmail, otp, userName = 'Campus Member', purpose = 'Password Reset') {
        try {
            const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #090e17; color: #f9fafb; margin: 0; padding: 20px; }
    .card { max-width: 520px; margin: 0 auto; background: #111827; border: 1px solid #1f2937; border-radius: 16px; padding: 32px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
    .brand { display: flex; align-items: center; gap: 8px; margin-bottom: 24px; }
    .brand-title { font-size: 20px; font-weight: 800; color: #10b981; letter-spacing: -0.5px; }
    .title { font-size: 18px; font-weight: 700; color: #ffffff; margin-bottom: 8px; }
    .desc { font-size: 14px; color: #9ca3af; line-height: 1.5; margin-bottom: 24px; }
    .otp-box { background: #090e17; border: 2px dashed #10b981; border-radius: 12px; padding: 18px; text-align: center; margin: 24px 0; }
    .otp-code { font-family: 'Courier New', Courier, monospace; font-size: 36px; font-weight: 900; letter-spacing: 12px; color: #10b981; margin: 0; }
    .expiry { font-size: 12px; color: #f59e0b; margin-top: 8px; }
    .security-notice { font-size: 12px; color: #6b7280; border-top: 1px solid #1f2937; padding-top: 16px; margin-top: 24px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="brand">
      <span class="brand-title">CampusRide Security</span>
    </div>
    <div class="title">Security Verification Code</div>
    <div class="desc">
      Hello <strong>${userName}</strong>,<br>
      We received a request to verify your identity for <strong>${purpose}</strong>. Please use the 6-digit verification code below to proceed:
    </div>
    <div class="otp-box">
      <div class="otp-code">${otp}</div>
      <div class="expiry">⏱️ Valid for 5 minutes only</div>
    </div>
    <div class="desc">
      Enter this code in your app to continue. If you did not request this verification code, please ignore this email or update your password immediately.
    </div>
    <div class="security-notice">
      CampusRide Automated Security System &bull; Please do not reply to this email. Never share your OTP with anyone.
    </div>
  </div>
</body>
</html>
      `.trim();
            const transporter = this.getEmailTransporter();
            const mailOptions = {
                from: env_1.ENV.SMTP_FROM,
                to: toEmail,
                subject: `🔐 ${otp} is your CampusRide Security Code`,
                text: `Hello ${userName},\n\nYour CampusRide verification code for ${purpose} is: ${otp}\n\nThis code is valid for 5 minutes. Do not share this code with anyone.\n\n- CampusRide Security Team`,
                html: emailHtml,
            };
            await transporter.sendMail(mailOptions);
            logger_1.logger.info(`[EMAIL DISPATCH] Successfully sent OTP ${otp} to email: ${toEmail}`);
            return true;
        }
        catch (err) {
            logger_1.logger.error(`[EMAIL DISPATCH FAILED] Error sending OTP to ${toEmail}: ${err.message}`);
            return false;
        }
    }
    /**
     * Dispatches OTP SMS via Fast2SMS / Twilio / MSG91 or Simulator Gateway
     */
    static async sendOtpSms(toPhone, otp, purpose = 'Password Reset') {
        const cleanPhone = toPhone.replace(/\D/g, '').slice(-10); // 10 digit phone for Indian gateways
        const message = `Your CampusRide verification code for ${purpose} is ${otp}. Valid for 5 minutes. Do not share this OTP with anyone.`;
        // 1. Fast2SMS Provider
        if (env_1.ENV.SMS_GATEWAY_PROVIDER === 'FAST2SMS' && env_1.ENV.FAST2SMS_API_KEY) {
            return new Promise((resolve) => {
                const postData = JSON.stringify({
                    route: 'otp',
                    variables_values: otp,
                    numbers: cleanPhone,
                });
                const req = https_1.default.request({
                    hostname: 'www.fast2sms.com',
                    path: '/dev/bulkV2',
                    method: 'POST',
                    headers: {
                        'authorization': env_1.ENV.FAST2SMS_API_KEY,
                        'Content-Type': 'application/json',
                        'Content-Length': Buffer.byteLength(postData),
                    },
                }, (res) => {
                    let body = '';
                    res.on('data', (d) => body += d);
                    res.on('end', () => {
                        logger_1.logger.info(`[FAST2SMS RESPONSE] Status: ${res.statusCode} Body: ${body}`);
                        resolve(res.statusCode === 200);
                    });
                });
                req.on('error', (e) => {
                    logger_1.logger.error(`[FAST2SMS ERROR]: ${e.message}`);
                    resolve(false);
                });
                req.write(postData);
                req.end();
            });
        }
        // 2. Twilio Provider
        if (env_1.ENV.SMS_GATEWAY_PROVIDER === 'TWILIO' && env_1.ENV.TWILIO_ACCOUNT_SID && env_1.ENV.TWILIO_AUTH_TOKEN) {
            return new Promise((resolve) => {
                const fullNumber = toPhone.startsWith('+') ? toPhone : `+91${cleanPhone}`;
                const auth = Buffer.from(`${env_1.ENV.TWILIO_ACCOUNT_SID}:${env_1.ENV.TWILIO_AUTH_TOKEN}`).toString('base64');
                const postData = new URLSearchParams({
                    To: fullNumber,
                    From: env_1.ENV.TWILIO_PHONE_NUMBER,
                    Body: message,
                }).toString();
                const req = https_1.default.request({
                    hostname: 'api.twilio.com',
                    path: `/2010-04-01/Accounts/${env_1.ENV.TWILIO_ACCOUNT_SID}/Messages.json`,
                    method: 'POST',
                    headers: {
                        'Authorization': `Basic ${auth}`,
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'Content-Length': Buffer.byteLength(postData),
                    },
                }, (res) => {
                    let body = '';
                    res.on('data', (d) => body += d);
                    res.on('end', () => {
                        logger_1.logger.info(`[TWILIO SMS RESPONSE] Status: ${res.statusCode}`);
                        resolve(res.statusCode === 200 || res.statusCode === 201);
                    });
                });
                req.on('error', (e) => {
                    logger_1.logger.error(`[TWILIO ERROR]: ${e.message}`);
                    resolve(false);
                });
                req.write(postData);
                req.end();
            });
        }
        // 3. Fallback / Simulator Dispatch
        logger_1.logger.info(`[SMS DISPATCH] Recipient: +91-${cleanPhone} | Message: "${message}"`);
        return true;
    }
}
exports.CommunicationService = CommunicationService;
//# sourceMappingURL=communicationService.js.map