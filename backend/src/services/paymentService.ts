import { db } from '../database/db';
import { PaymentProvider } from '../integrations/paymentProvider';
import { NotificationProvider } from '../integrations/notificationProvider';
import { Payment, Subscription } from '../types';

export class PaymentService {
  /**
   * Initiate subscription purchase
   */
  public static async initiateSubscriptionPayment(
    studentId: string,
    planId: string,
    paymentMethod: 'UPI' | 'DEBIT_CARD' | 'CREDIT_CARD' | 'NET_BANKING' | 'WALLET' = 'UPI',
    autoRenew = false
  ) {
    const plan = db.subscriptionPlans.get(planId);
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
    const now = new Date().toISOString();
    const paymentId = `pay-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const subId = `sub-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

    // Create Pending Payment record
    const paymentRecord: Payment = {
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
    db.payments.set(paymentId, paymentRecord);

    // Create Pending Subscription record
    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + plan.validity_days * 86400000);

    const subscriptionRecord: Subscription = {
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
    db.subscriptions.set(subId, subscriptionRecord);

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
  public static async confirmPayment(
    paymentId: string,
    gatewayPaymentId: string,
    signature: string
  ): Promise<{ payment: Payment; subscription: Subscription }> {
    const payment = db.payments.get(paymentId);
    if (!payment) {
      const err: any = new Error('Payment record not found.');
      err.statusCode = 404;
      err.code = 'PAYMENT_NOT_FOUND';
      throw err;
    }

    if (payment.status === 'SUCCESS') {
      const sub = db.subscriptions.get(payment.subscription_id!);
      return { payment, subscription: sub! };
    }

    // Verify signature
    const verification = PaymentProvider.verifyPaymentSignature(
      payment.gateway_order_id || '',
      gatewayPaymentId,
      signature
    );

    if (!verification.isVerified) {
      payment.status = 'FAILED';
      payment.error_message = verification.error || 'Signature verification failed';
      payment.updated_at = new Date().toISOString();
      db.payments.set(paymentId, payment);

      const err: any = new Error('Payment signature verification failed.');
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
    db.payments.set(paymentId, payment);

    // Activate Subscription
    const subscription = db.subscriptions.get(payment.subscription_id!);
    if (!subscription) {
      const err: any = new Error('Associated subscription not found.');
      err.statusCode = 404;
      err.code = 'SUBSCRIPTION_NOT_FOUND';
      throw err;
    }

    subscription.status = 'ACTIVE';
    subscription.updated_at = now;
    db.subscriptions.set(subscription.id, subscription);

    // Send confirmation notification
    await NotificationProvider.send(
      payment.student_id,
      'Subscription Activated!',
      `Your subscription (${subscription.plan?.name || 'Commuter Pass'}) is now active with ${subscription.total_rides_allocated} rides.`,
      'PAYMENT',
      { subscriptionId: subscription.id, paymentId }
    );

    return { payment, subscription };
  }
}
