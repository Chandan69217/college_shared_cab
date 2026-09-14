import { Router } from 'express';
import { StudentController } from '../controllers/studentController';
import { authenticateJwt } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { auditLog } from '../middleware/auditLog';

const router = Router();

router.use(authenticateJwt);
router.use(requireRole(['STUDENT']));

router.get('/dashboard', StudentController.getDashboard);
router.post('/verification', auditLog('SUBMIT_VERIFICATION', 'student_profiles'), StudentController.submitVerification);
router.get('/subscriptions', StudentController.getSubscriptions);
router.get('/bookings', StudentController.getBookings);
router.get('/passes', StudentController.getPasses);
router.get('/payments', StudentController.getPayments);
router.post('/sos', auditLog('TRIGGER_SOS', 'emergency_alert'), StudentController.triggerSos);

export default router;
