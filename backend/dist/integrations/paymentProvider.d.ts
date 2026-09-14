import { PaymentMethod } from '../types';
export interface PaymentInitiationResult {
    gatewayOrderId: string;
    amount: number;
    currency: string;
    keyId: string;
    receiptNumber: string;
    paymentMethods: PaymentMethod[];
}
export interface PaymentVerificationResult {
    isVerified: boolean;
    transactionId: string;
    gatewayOrderId: string;
    error?: string;
}
export declare class PaymentProvider {
    /**
     * Initiates payment order with gateway
     */
    static createOrder(amount: number, studentId: string, planId: string): Promise<PaymentInitiationResult>;
    /**
     * Verifies HMAC signature of webhook/callback
     */
    static verifyPaymentSignature(gatewayOrderId: string, gatewayPaymentId: string, signature: string): PaymentVerificationResult;
}
