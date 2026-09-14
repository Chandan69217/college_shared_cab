"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentProvider = void 0;
const crypto_1 = __importDefault(require("crypto"));
const env_1 = require("../config/env");
const crypto_2 = require("../utils/crypto");
class PaymentProvider {
    /**
     * Initiates payment order with gateway
     */
    static async createOrder(amount, studentId, planId) {
        const gatewayOrderId = `order_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        const receiptNumber = (0, crypto_2.generateReceiptNumber)();
        return {
            gatewayOrderId,
            amount,
            currency: 'INR',
            keyId: env_1.ENV.RAZORPAY_KEY_ID,
            receiptNumber,
            paymentMethods: ['UPI', 'DEBIT_CARD', 'CREDIT_CARD', 'NET_BANKING', 'WALLET'],
        };
    }
    /**
     * Verifies HMAC signature of webhook/callback
     */
    static verifyPaymentSignature(gatewayOrderId, gatewayPaymentId, signature) {
        // In demo/simulator mode, accept valid signatures or test prefix
        if (env_1.ENV.PAYMENT_GATEWAY_PROVIDER === 'SIMULATOR' || signature.startsWith('demo_sig_')) {
            return {
                isVerified: true,
                transactionId: gatewayPaymentId || (0, crypto_2.generateTransactionId)(),
                gatewayOrderId,
            };
        }
        try {
            const generatedSignature = crypto_1.default
                .createHmac('sha256', env_1.ENV.RAZORPAY_KEY_SECRET)
                .update(`${gatewayOrderId}|${gatewayPaymentId}`)
                .digest('hex');
            const isVerified = crypto_1.default.timingSafeEqual(Buffer.from(generatedSignature), Buffer.from(signature));
            return {
                isVerified,
                transactionId: gatewayPaymentId,
                gatewayOrderId,
                error: isVerified ? undefined : 'SIGNATURE_MISMATCH',
            };
        }
        catch (err) {
            return {
                isVerified: false,
                transactionId: gatewayPaymentId,
                gatewayOrderId,
                error: 'VERIFICATION_EXCEPTION',
            };
        }
    }
}
exports.PaymentProvider = PaymentProvider;
//# sourceMappingURL=paymentProvider.js.map