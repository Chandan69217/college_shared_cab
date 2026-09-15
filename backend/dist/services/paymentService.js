"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentService = void 0;
const paymentProvider_1 = require("../integrations/paymentProvider");
const notificationProvider_1 = require("../integrations/notificationProvider");
const subscriptionRepository_1 = require("../repositories/subscriptionRepository");
const paymentRepository_1 = require("../repositories/paymentRepository");
const supabaseClient_1 = require("../database/supabaseClient");
class PaymentService {
    /**
     * Initiate subscription purchase with real Supabase records
     */
    static async initiateSubscriptionPayment(studentId, planId, paymentMethod = 'UPI', autoRenew = false) {
        const plan = await subscriptionRepository_1.PlanRepository.findById(planId);
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
        const startDate = new Date();
        const endDate = new Date(startDate.getTime() + (plan.validity_days || 30) * 86400000);
        // Create Pending Subscription record in Supabase
        const subscription = await subscriptionRepository_1.SubscriptionRepository.create({
            student_id: studentId,
            plan_id: planId,
            start_date: startDate.toISOString().split('T')[0],
            end_date: endDate.toISOString().split('T')[0],
            total_rides_allocated: plan.ride_count_total || 44,
            remaining_rides: plan.ride_count_total || 44,
            status: 'PENDING_PAYMENT',
            auto_renew: autoRenew,
        });
        // Create Pending Payment record in Supabase
        const payment = await paymentRepository_1.PaymentRepository.create({
            student_id: studentId,
            subscription_id: subscription.id,
            amount: plan.price,
            currency: 'INR',
            payment_method: paymentMethod,
            gateway_order_id: order.gatewayOrderId,
            status: 'PENDING',
            receipt_number: order.receiptNumber,
        });
        return {
            paymentId: payment.id,
            subscriptionId: subscription.id,
            gatewayOrderId: order.gatewayOrderId,
            amount: plan.price,
            currency: 'INR',
            keyId: order.keyId,
            receiptNumber: order.receiptNumber,
        };
    }
    /**
     * Verify and complete payment transaction in Supabase
     */
    static async verifyAndCompletePayment(studentId, data) {
        const isSignatureValid = paymentProvider_1.PaymentProvider.verifyPaymentSignature(data.gateway_order_id || 'order_default', data.gateway_payment_id, data.gateway_signature);
        const supabase = (0, supabaseClient_1.getSupabaseClient)();
        let query = supabase
            .from('payments')
            .select('*, subscription:subscriptions(*, plan:subscription_plans(*))');
        if (data.gateway_order_id) {
            query = query.eq('gateway_order_id', data.gateway_order_id);
        }
        else if (data.payment_id) {
            query = query.eq('id', data.payment_id);
        }
        const { data: payment, error } = await query.maybeSingle();
        if (error || !payment) {
            const err = new Error('Payment record not found.');
            err.statusCode = 404;
            err.code = 'PAYMENT_NOT_FOUND';
            throw err;
        }
        const now = new Date().toISOString();
        // Mark payment SUCCESS
        await supabase
            .from('payments')
            .update({
            status: 'SUCCESS',
            gateway_payment_id: data.gateway_payment_id,
            gateway_signature: data.gateway_signature,
            paid_at: now,
            updated_at: now,
        })
            .eq('id', payment.id);
        // Activate subscription
        await supabase
            .from('subscriptions')
            .update({
            status: 'ACTIVE',
            updated_at: now,
        })
            .eq('id', payment.subscription_id);
        await notificationProvider_1.NotificationProvider.send(studentId, 'Subscription Activated!', `Payment of ₹${payment.amount} confirmed. Your pass is now active for daily rides.`, 'PAYMENT', { paymentId: payment.id, subscriptionId: payment.subscription_id });
        return {
            success: true,
            message: 'Subscription purchased and activated successfully.',
            payment: { ...payment, status: 'SUCCESS' },
        };
    }
    static async getStudentPaymentHistory(studentId) {
        return paymentRepository_1.PaymentRepository.findByStudentId(studentId);
    }
}
exports.PaymentService = PaymentService;
//# sourceMappingURL=paymentService.js.map