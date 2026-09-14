import { Router } from 'express';
import { QrController } from '../controllers/qrController';
import { authenticateJwt } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { auditLog } from '../middleware/auditLog';

const router = Router();

router.use(authenticateJwt);

// Student fetch signed Dynamic QR token for an active pass
router.get('/student/pass/:passId', requireRole(['STUDENT']), QrController.getStudentQr);

// Driver camera scan validation & boarding confirmation
router.post('/driver/verify-scan', requireRole(['DRIVER']), auditLog('VERIFY_QR_SCAN', 'daily_travel_passes'), QrController.verifyScan);

export default router;
