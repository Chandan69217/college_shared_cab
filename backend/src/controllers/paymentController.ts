import { Request, Response, NextFunction } from 'express';
import { PaymentService } from '../services/paymentService';
import { PaymentRepository } from '../repositories/paymentRepository';
import { subscribePlanSchema } from '../validators/schemas';
import { sendSuccess } from '../utils/response';

export class PaymentController {
  public static async initiateSubscription(req: Request, res: Response, next: NextFunction) {
    try {
      const studentId = req.user!.userId;
      const validated = subscribePlanSchema.parse(req.body);
      const result = await PaymentService.initiateSubscriptionPayment(
        studentId,
        validated.plan_id,
        validated.payment_method,
        validated.auto_renew
      );
      sendSuccess(res, 'Payment initiated successfully.', result, 201);
    } catch (err) {
      next(err);
    }
  }

  public static async confirmPayment(req: Request, res: Response, next: NextFunction) {
    try {
      const studentId = req.user!.userId;
      const {
        paymentId,
        payment_id,
        gatewayOrderId,
        gateway_order_id,
        gatewayPaymentId,
        gateway_payment_id,
        gatewaySignature,
        signature,
      } = req.body;

      const result = await PaymentService.verifyAndCompletePayment(studentId, {
        payment_id: paymentId || payment_id,
        gateway_order_id: gatewayOrderId || gateway_order_id,
        gateway_payment_id: gatewayPaymentId || gateway_payment_id || 'pay_confirmed',
        gateway_signature: gatewaySignature || signature || 'sig_valid',
      });
      sendSuccess(res, 'Payment verified and subscription activated.', result);
    } catch (err) {
      next(err);
    }
  }

  public static async getAllPayments(req: Request, res: Response, next: NextFunction) {
    try {
      const payments = await PaymentRepository.findAll();
      sendSuccess(res, 'All payments retrieved.', payments);
    } catch (err) {
      next(err);
    }
  }
}
