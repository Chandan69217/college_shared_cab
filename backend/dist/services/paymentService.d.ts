export declare class PaymentService {
    /**
     * Initiate subscription purchase with real Supabase records
     */
    static initiateSubscriptionPayment(studentId: string, planId: string, paymentMethod?: 'UPI' | 'DEBIT_CARD' | 'CREDIT_CARD' | 'NET_BANKING' | 'WALLET', autoRenew?: boolean): Promise<{
        paymentId: string;
        subscriptionId: string;
        gatewayOrderId: string;
        amount: number;
        currency: string;
        keyId: string;
        receiptNumber: string;
    }>;
    /**
     * Verify and complete payment transaction in Supabase
     */
    static verifyAndCompletePayment(studentId: string, data: {
        gateway_order_id?: string;
        gateway_payment_id: string;
        gateway_signature: string;
        payment_id?: string;
    }): Promise<{
        success: boolean;
        message: string;
        payment: any;
    }>;
    static getStudentPaymentHistory(studentId: string): Promise<import("../types").Payment[]>;
}
