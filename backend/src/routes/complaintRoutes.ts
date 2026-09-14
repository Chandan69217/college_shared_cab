import { Router } from 'express';
import { ComplaintController } from '../controllers/complaintController';
import { authenticateJwt } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { auditLog } from '../middleware/auditLog';

const router = Router();

router.use(authenticateJwt);

// Student create support ticket / rate trip
router.post('/', requireRole(['STUDENT']), auditLog('CREATE_COMPLAINT', 'complaints'), ComplaintController.createComplaint);
router.get('/my', requireRole(['STUDENT']), ComplaintController.getStudentComplaints);
router.post('/rate-trip', requireRole(['STUDENT']), auditLog('RATE_TRIP', 'ratings'), ComplaintController.rateTrip);

// Admin view and reply to complaints
router.get('/', requireRole(['ADMIN']), ComplaintController.getAllComplaints);
router.patch('/:id/reply', requireRole(['ADMIN']), auditLog('REPLY_COMPLAINT', 'complaints'), ComplaintController.replyComplaint);

export default router;
