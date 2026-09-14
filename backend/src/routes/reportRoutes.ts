import { Router } from 'express';
import { ReportController } from '../controllers/reportController';
import { authenticateJwt } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';

const router = Router();

router.use(authenticateJwt);
router.use(requireRole(['ADMIN']));

router.get('/', ReportController.getReports);

export default router;
