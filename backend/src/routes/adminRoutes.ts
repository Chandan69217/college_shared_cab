import { Router } from 'express';
import { AdminController } from '../controllers/adminController';
import { authenticateJwt } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { auditLog } from '../middleware/auditLog';

const router = Router();

router.use(authenticateJwt);
router.use(requireRole(['ADMIN']));

router.get('/dashboard-stats', AdminController.getDashboardStats);
router.get('/students', AdminController.getStudents);
router.patch('/students/:studentId/verification', auditLog('VERIFY_STUDENT', 'student_profiles'), AdminController.verifyStudent);
router.get('/drivers', AdminController.getDrivers);
router.post('/drivers', auditLog('CREATE_DRIVER', 'driver_profiles'), AdminController.createDriver);
router.get('/audit-logs', AdminController.getAuditLogs);

export default router;
