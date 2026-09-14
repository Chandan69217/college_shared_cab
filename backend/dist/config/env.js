"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ENV = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.ENV = {
    PORT: parseInt(process.env.PORT || '5000', 10),
    NODE_ENV: process.env.NODE_ENV || 'development',
    API_PREFIX: process.env.API_PREFIX || '/api/v1',
    CORS_ORIGIN: process.env.CORS_ORIGIN || '*',
    JWT_SECRET: process.env.JWT_SECRET || 'super_secret_production_ready_jwt_signing_key_college_cab_2026',
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
    QR_HMAC_SECRET: process.env.QR_HMAC_SECRET || 'secure_hmac_secret_for_dynamic_qr_pass_signatures_2026',
    DATABASE_URL: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/college_cab',
    SUPABASE_URL: process.env.SUPABASE_URL || 'https://mock-supabase.collegecab.local',
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || 'dummy_anon_key_for_client',
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || 'dummy_service_role_key_for_backend',
    PAYMENT_GATEWAY_PROVIDER: process.env.PAYMENT_GATEWAY_PROVIDER || 'SIMULATOR',
    RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID || 'rzp_test_demo_college_cab',
    RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET || 'rzp_test_secret_demo_college_cab',
    PAYMENT_WEBHOOK_SECRET: process.env.PAYMENT_WEBHOOK_SECRET || 'webhook_secret_demo_college_cab',
    MAPS_API_KEY: process.env.MAPS_API_KEY || 'dummy_maps_key_for_demo',
    FCM_SERVER_KEY: process.env.FCM_SERVER_KEY || 'dummy_fcm_key_for_demo',
    DEFAULT_SERVICE_RADIUS_KM: parseFloat(process.env.DEFAULT_SERVICE_RADIUS_KM || '10.0'),
};
//# sourceMappingURL=env.js.map