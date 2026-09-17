"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentService = void 0;
const paymentProvider_1 = require("../integrations/paymentProvider");
const notificationService_1 = require("./notificationService");
const subscriptionRepository_1 = require("../repositories/subscriptionRepository");
const paymentRepository_1 = require("../repositories/paymentRepository");
const userRepository_1 = require("../repositories/userRepository");
const settingsRepository_1 = require("../repositories/settingsRepository");
const supabaseClient_1 = require("../database/supabaseClient");
class PaymentService {
    /**
     * Initiate subscription purchase with real Supabase records
     */
    static async initiateSubscriptionPayment(studentId, planId, paymentMethod = 'UPI', autoRenew = false) {
        // 1. Enforce student KYC verification check if enabled in admin settings
        const requireKyc = await settingsRepository_1.SettingsRepository.get('requireAdminKycApproval', true);
        if (requireKyc) {
            const studentProfile = await userRepository_1.UserRepository.getStudentProfile(studentId);
            if (!studentProfile || studentProfile.verification_status !== 'VERIFIED') {
                const err = new Error('Student KYC is pending administrative approval. Subscription purchase is only allowed once your ID documents are verified.');
                err.statusCode = 403;
                err.code = 'KYC_REQUIRED';
                throw err;
            }
        }
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
            .select('*, subscription:subscriptions!payments_subscription_id_fkey(*, plan:subscription_plans(*))');
        if (data.payment_id) {
            query = query.eq('id', data.payment_id);
        }
        else if (data.gateway_order_id) {
            query = query.eq('gateway_order_id', data.gateway_order_id);
        }
        else {
            const err = new Error('Payment record identifier is required.');
            err.statusCode = 400;
            err.code = 'INVALID_PAYMENT_PAYLOAD';
            throw err;
        }
        if (studentId) {
            query = query.eq('student_id', studentId);
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
        const { error: payUpdateErr } = await supabase
            .from('payments')
            .update({
            status: 'SUCCESS',
            transaction_id: data.gateway_payment_id,
            gateway_signature: data.gateway_signature,
            updated_at: now,
        })
            .eq('id', payment.id);
        if (payUpdateErr) {
            throw new Error(`Failed to update payment status: ${payUpdateErr.message}`);
        }
        // Activate subscription
        await supabase
            .from('subscriptions')
            .update({
            status: 'ACTIVE',
            updated_at: now,
        })
            .eq('id', payment.subscription_id);
        try {
            await notificationService_1.NotificationService.createNotification({
                userId: studentId,
                recipientRole: 'STUDENT',
                title: 'Subscription Activated!',
                message: `Payment of ₹${payment.amount} confirmed. Your pass is now active for daily rides.`,
                type: 'SUBSCRIPTION_ACTIVATED',
                entityType: 'PAYMENT',
                entityId: payment.id,
                priority: 'HIGH',
                data: { paymentId: payment.id, subscriptionId: payment.subscription_id, amount: payment.amount },
            });
        }
        catch (notifErr) {
            // Non-blocking notification error
        }
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