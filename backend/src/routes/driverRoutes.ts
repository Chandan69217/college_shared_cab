import { Router } from 'express';
import { DriverController } from '../controllers/driverController';
import { authenticateJwt } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { auditLog } from '../middleware/auditLog';

const router = Router();

router.use(authenticateJwt);
router.use(requireRole(['DRIVER']));

router.get('/dashboard', DriverController.getDashboard);
router.get('/trips/:tripId/manifest', DriverController.getManifest);
router.post('/trips/:tripId/start', auditLog('START_TRIP', 'trips'), DriverController.startTrip);
router.post('/trips/:tripId/end', auditLog('END_TRIP', 'trips'), DriverController.endTrip);

export default router;
