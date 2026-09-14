import { Request, Response, NextFunction } from 'express';
import { PaymentService } from '../services/paymentService';
import { subscribePlanSchema } from '../validators/schemas';
import { sendSuccess } from '../utils/response';
import { db } from '../database/db';

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
      const { paymentId, gatewayPaymentId, signature } = req.body;
      const result = await PaymentService.confirmPayment(
        paymentId,
        gatewayPaymentId || 'demo_pay_id',
        signature || 'demo_sig_approved'
      );
      sendSuccess(res, 'Payment verified and subscription activated.', result);
    } catch (err) {
      next(err);
    }
  }

  public static async getAllPayments(req: Request, res: Response, next: NextFunction) {
    try {
      const payments: any[] = [];
      for (const p of db.payments.values()) {
        const student = db.users.get(p.student_id);
        payments.push({
          ...p,
          student: student ? { name: student.full_name, email: student.email, phone: student.phone } : undefined,
        });
      }
      sendSuccess(res, 'All payments retrieved.', payments.reverse());
    } catch (err) {
      next(err);
    }
  }
}
