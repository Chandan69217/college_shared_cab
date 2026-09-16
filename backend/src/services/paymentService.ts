import { PaymentProvider } from '../integrations/paymentProvider';
import { NotificationProvider } from '../integrations/notificationProvider';
import { PlanRepository, SubscriptionRepository } from '../repositories/subscriptionRepository';
import { PaymentRepository } from '../repositories/paymentRepository';
import { getSupabaseClient } from '../database/supabaseClient';

export class PaymentService {
  /**
   * Initiate subscription purchase with real Supabase records
   */
  public static async initiateSubscriptionPayment(
    studentId: string,
    planId: string,
    paymentMethod: 'UPI' | 'DEBIT_CARD' | 'CREDIT_CARD' | 'NET_BANKING' | 'WALLET' = 'UPI',
    autoRenew = false
  ) {
    const plan = await PlanRepository.findById(planId);
    if (!plan) {
      const err: any = new Error('Subscription plan not found.');
      err.statusCode = 404;
      err.code = 'PLAN_NOT_FOUND';
      throw err;
    }

    if (plan.status !== 'ACTIVE') {
      const err: any = new Error('This subscription plan is not currently available.');
      err.statusCode = 400;
      err.code = 'PLAN_INACTIVE';
      throw err;
    }

    const order = await PaymentProvider.createOrder(plan.price, studentId, planId);
    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + (plan.validity_days || 30) * 86400000);

    // Create Pending Subscription record in Supabase
    const subscription = await SubscriptionRepository.create({
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
    const payment = await PaymentRepository.create({
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
  public static async verifyAndCompletePayment(
    studentId: string,
    data: {
      gateway_order_id?: string;
      gateway_payment_id: string;
      gateway_signature: string;
      payment_id?: string;
    }
  ) {
    const isSignatureValid = PaymentProvider.verifyPaymentSignature(
      data.gateway_order_id || 'order_default',
      data.gateway_payment_id,
      data.gateway_signature
    );

    const supabase = getSupabaseClient()!;
    let query = supabase
      .from('payments')
      .select('*, subscription:subscriptions!payments_subscription_id_fkey(*, plan:subscription_plans(*))');

    if (data.payment_id) {
      query = query.eq('id', data.payment_id);
    } else if (data.gateway_order_id) {
      query = query.eq('gateway_order_id', data.gateway_order_id);
    } else {
      const err: any = new Error('Payment record identifier is required.');
      err.statusCode = 400;
      err.code = 'INVALID_PAYMENT_PAYLOAD';
      throw err;
    }

    if (studentId) {
      query = query.eq('student_id', studentId);
    }

    const { data: payment, error } = await query.maybeSingle();

    if (error || !payment) {
      const err: any = new Error('Payment record not found.');
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

    await NotificationProvider.send(
      studentId,
      'Subscription Activated!',
      `Payment of ₹${payment.amount} confirmed. Your pass is now active for daily rides.`,
      'PAYMENT',
      { paymentId: payment.id, subscriptionId: payment.subscription_id }
    );

    return {
      success: true,
      message: 'Subscription purchased and activated successfully.',
      payment: { ...payment, status: 'SUCCESS' },
    };
  }

  public static async getStudentPaymentHistory(studentId: string) {
    return PaymentRepository.findByStudentId(studentId);
  }
}
