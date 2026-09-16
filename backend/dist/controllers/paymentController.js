"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentController = void 0;
const paymentService_1 = require("../services/paymentService");
const paymentRepository_1 = require("../repositories/paymentRepository");
const schemas_1 = require("../validators/schemas");
const response_1 = require("../utils/response");
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
            const studentId = req.user.userId;
            const { paymentId, payment_id, gatewayOrderId, gateway_order_id, gatewayPaymentId, gateway_payment_id, gatewaySignature, signature, } = req.body;
            const result = await paymentService_1.PaymentService.verifyAndCompletePayment(studentId, {
                payment_id: paymentId || payment_id,
                gateway_order_id: gatewayOrderId || gateway_order_id,
                gateway_payment_id: gatewayPaymentId || gateway_payment_id || 'pay_confirmed',
                gateway_signature: gatewaySignature || signature || 'sig_valid',
            });
            (0, response_1.sendSuccess)(res, 'Payment verified and subscription activated.', result);
        }
        catch (err) {
            next(err);
        }
    }
    static async getAllPayments(req, res, next) {
        try {
            const payments = await paymentRepository_1.PaymentRepository.findAll();
            (0, response_1.sendSuccess)(res, 'All payments retrieved.', payments);
        }
        catch (err) {
            next(err);
        }
    }
}
exports.PaymentController = PaymentController;
//# sourceMappingURL=paymentController.js.map