"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const paymentController_1 = require("../controllers/paymentController");
const auth_1 = require("../middleware/auth");
const rbac_1 = require("../middleware/rbac");
const auditLog_1 = require("../middleware/auditLog");
const router = (0, express_1.Router)();
router.use(auth_1.authenticateJwt);
// Student initiate purchase
router.post('/subscriptions/initiate', (0, rbac_1.requireRole)(['STUDENT']), (0, auditLog_1.auditLog)('INITIATE_PAYMENT', 'payments'), paymentController_1.PaymentController.initiateSubscription);
// Confirm payment / webhook signature confirmation
router.post('/confirm', (0, auditLog_1.auditLog)('CONFIRM_PAYMENT', 'payments'), paymentController_1.PaymentController.confirmPayment);
// Admin get all payments
router.get('/', (0, rbac_1.requireRole)(['ADMIN']), paymentController_1.PaymentController.getAllPayments);
exports.default = router;
//# sourceMappingURL=paymentRoutes.js.map