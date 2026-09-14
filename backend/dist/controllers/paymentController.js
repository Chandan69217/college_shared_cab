"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentController = void 0;
const paymentService_1 = require("../services/paymentService");
const schemas_1 = require("../validators/schemas");
const response_1 = require("../utils/response");
const db_1 = require("../database/db");
class PaymentController {
    static async initiateSubscription(req, res, next) {
        try {
            const studentId = req.user.userId;
            const validated = schemas_1.subscribePlanSchema.parse(req.body);
            const result = await paymentService_1.PaymentService.initiateSubscriptionPayment(studentId, validated.plan_id, validated.payment_method, validated.auto_renew);
            (0, response_1.sendSuccess)(res, 'Payment initiated successfully.', result, 201);
        }
        catch (err) {
            next(err);
        }
    }
    static async confirmPayment(req, res, next) {
        try {
            const { paymentId, gatewayPaymentId, signature } = req.body;
            const result = await paymentService_1.PaymentService.confirmPayment(paymentId, gatewayPaymentId || 'demo_pay_id', signature || 'demo_sig_approved');
            (0, response_1.sendSuccess)(res, 'Payment verified and subscription activated.', result);
        }
        catch (err) {
            next(err);
        }
    }
    static async getAllPayments(req, res, next) {
        try {
            const payments = [];
            for (const p of db_1.db.payments.values()) {
                const student = db_1.db.users.get(p.student_id);
                payments.push({
                    ...p,
                    student: student ? { name: student.full_name, email: student.email, phone: student.phone } : undefined,
                });
            }
            (0, response_1.sendSuccess)(res, 'All payments retrieved.', payments.reverse());
        }
        catch (err) {
            next(err);
        }
    }
}
exports.PaymentController = PaymentController;
//# sourceMappingURL=paymentController.js.map