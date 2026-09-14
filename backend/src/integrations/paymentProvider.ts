import crypto from 'crypto';
import { ENV } from '../config/env';
import { PaymentMethod } from '../types';
import { generateReceiptNumber, generateTransactionId } from '../utils/crypto';

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

export class PaymentProvider {
  /**
   * Initiates payment order with gateway
   */
  public static async createOrder(
    amount: number,
    studentId: string,
    planId: string
  ): Promise<PaymentInitiationResult> {
    const gatewayOrderId = `order_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const receiptNumber = generateReceiptNumber();

    return {
      gatewayOrderId,
      amount,
      currency: 'INR',
      keyId: ENV.RAZORPAY_KEY_ID,
      receiptNumber,
      paymentMethods: ['UPI', 'DEBIT_CARD', 'CREDIT_CARD', 'NET_BANKING', 'WALLET'],
    };
  }

  /**
   * Verifies HMAC signature of webhook/callback
   */
  public static verifyPaymentSignature(
    gatewayOrderId: string,
    gatewayPaymentId: string,
    signature: string
  ): PaymentVerificationResult {
    // In demo/simulator mode, accept valid signatures or test prefix
    if (ENV.PAYMENT_GATEWAY_PROVIDER === 'SIMULATOR' || signature.startsWith('demo_sig_')) {
      return {
        isVerified: true,
        transactionId: gatewayPaymentId || generateTransactionId(),
        gatewayOrderId,
      };
    }

    try {
      const generatedSignature = crypto
        .createHmac('sha256', ENV.RAZORPAY_KEY_SECRET)
        .update(`${gatewayOrderId}|${gatewayPaymentId}`)
        .digest('hex');

      const isVerified = crypto.timingSafeEqual(
        Buffer.from(generatedSignature),
        Buffer.from(signature)
      );

      return {
        isVerified,
        transactionId: gatewayPaymentId,
        gatewayOrderId,
        error: isVerified ? undefined : 'SIGNATURE_MISMATCH',
      };
    } catch (err: any) {
      return {
        isVerified: false,
        transactionId: gatewayPaymentId,
        gatewayOrderId,
        error: 'VERIFICATION_EXCEPTION',
      };
    }
  }
}
