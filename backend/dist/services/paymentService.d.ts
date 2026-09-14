import { Payment, Subscription } from '../types';
export declare class PaymentService {
    /**
     * Initiate subscription purchase
     */
    static initiateSubscriptionPayment(studentId: string, planId: string, paymentMethod?: 'UPI' | 'DEBIT_CARD' | 'CREDIT_CARD' | 'NET_BANKING' | 'WALLET', autoRenew?: boolean): Promise<{
        paymentId: string;
        subscriptionId: string;
        gatewayOrderId: string;
        amount: number;
        currency: string;
        receiptNumber: string;
        keyId: string;
    }>;
    /**
     * Confirm and activate payment (Webhook or verified client callback)
     */
    static confirmPayment(paymentId: string, gatewayPaymentId: string, signature: string): Promise<{
        payment: Payment;
        subscription: Subscription;
    }>;
}
