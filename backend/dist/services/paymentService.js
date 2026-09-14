"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentService = void 0;
const db_1 = require("../database/db");
const paymentProvider_1 = require("../integrations/paymentProvider");
const notificationProvider_1 = require("../integrations/notificationProvider");
class PaymentService {
    /**
     * Initiate subscription purchase
     */
    static async initiateSubscriptionPayment(studentId, planId, paymentMethod = 'UPI', autoRenew = false) {
        const plan = db_1.db.subscriptionPlans.get(planId);
        if (!plan) {
            const err = new Error('Subscription plan not found.');
            err.statusCode = 404;
            err.code = 'PLAN_NOT_FOUND';
            throw err;
        }
        if (plan.status !== 'ACTIVE') {
            const err = new Error('This subscription plan is not currently available.');
            err.statusCode = 400;
            err.code = 'PLAN_INACTIVE';
            throw err;
        }
        const order = await paymentProvider_1.PaymentProvider.createOrder(plan.price, studentId, planId);
        const now = new Date().toISOString();
        const paymentId = `pay-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
        const subId = `sub-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
        // Create Pending Payment record
        const paymentRecord = {
            id: paymentId,
            student_id: studentId,
            subscription_id: subId,
            amount: plan.price,
            currency: 'INR',
            payment_method: paymentMethod,
            gateway_order_id: order.gatewayOrderId,
            status: 'PENDING',
            receipt_number: order.receiptNumber,
            created_at: now,
            updated_at: now,
        };
        db_1.db.payments.set(paymentId, paymentRecord);
        // Create Pending Subscription record
        const startDate = new Date();
        const endDate = new Date(startDate.getTime() + plan.validity_days * 86400000);
        const subscriptionRecord = {
            id: subId,
            student_id: studentId,
            plan_id: planId,
            plan,
            start_date: startDate.toISOString().split('T')[0],
            end_date: endDate.toISOString().split('T')[0],
            total_rides_allocated: plan.ride_count_total,
            remaining_rides: plan.ride_count_total,
            status: 'PENDING_PAYMENT',
            payment_id: paymentId,
            auto_renew: autoRenew,
            created_at: now,
            updated_at: now,
        };
        db_1.db.subscriptions.set(subId, subscriptionRecord);
        return {
            paymentId,
            subscriptionId: subId,
            gatewayOrderId: order.gatewayOrderId,
            amount: plan.price,
            currency: 'INR',
            receiptNumber: order.receiptNumber,
            keyId: order.keyId,
        };
    }
    /**
     * Confirm and activate payment (Webhook or verified client callback)
     */
    static async confirmPayment(paymentId, gatewayPaymentId, signature) {
        const payment = db_1.db.payments.get(paymentId);
        if (!payment) {
            const err = new Error('Payment record not found.');
            err.statusCode = 404;
            err.code = 'PAYMENT_NOT_FOUND';
            throw err;
        }
        if (payment.status === 'SUCCESS') {
            const sub = db_1.db.subscriptions.get(payment.subscription_id);
            return { payment, subscription: sub };
        }
        // Verify signature
        const verification = paymentProvider_1.PaymentProvider.verifyPaymentSignature(payment.gateway_order_id || '', gatewayPaymentId, signature);
        if (!verification.isVerified) {
            payment.status = 'FAILED';
            payment.error_message = verification.error || 'Signature verification failed';
            payment.updated_at = new Date().toISOString();
            db_1.db.payments.set(paymentId, payment);
            const err = new Error('Payment signature verification failed.');
            err.statusCode = 400;
            err.code = 'PAYMENT_VERIFICATION_FAILED';
            throw err;
        }
        // Update payment to SUCCESS
        const now = new Date().toISOString();
        payment.status = 'SUCCESS';
        payment.transaction_id = verification.transactionId;
        payment.gateway_signature = signature;
        payment.updated_at = now;
        db_1.db.payments.set(paymentId, payment);
        // Activate Subscription
        const subscription = db_1.db.subscriptions.get(payment.subscription_id);
        if (!subscription) {
            const err = new Error('Associated subscription not found.');
            err.statusCode = 404;
            err.code = 'SUBSCRIPTION_NOT_FOUND';
            throw err;
        }
        subscription.status = 'ACTIVE';
        subscription.updated_at = now;
        db_1.db.subscriptions.set(subscription.id, subscription);
        // Send confirmation notification
        await notificationProvider_1.NotificationProvider.send(payment.student_id, 'Subscription Activated!', `Your subscription (${subscription.plan?.name || 'Commuter Pass'}) is now active with ${subscription.total_rides_allocated} rides.`, 'PAYMENT', { subscriptionId: subscription.id, paymentId });
        return { payment, subscription };
    }
}
exports.PaymentService = PaymentService;
//# sourceMappingURL=paymentService.js.map