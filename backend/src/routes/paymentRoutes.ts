import { Router } from 'express';
import { PaymentController } from '../controllers/paymentController';
import { authenticateJwt } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { auditLog } from '../middleware/auditLog';

const router = Router();

router.use(authenticateJwt);

// Student initiate purchase
router.post('/subscriptions/initiate', requireRole(['STUDENT']), auditLog('INITIATE_PAYMENT', 'payments'), PaymentController.initiateSubscription);

// Confirm payment / webhook signature confirmation
router.post('/confirm', auditLog('CONFIRM_PAYMENT', 'payments'), PaymentController.confirmPayment);

// Admin get all payments
router.get('/', requireRole(['ADMIN']), PaymentController.getAllPayments);

export default router;
