import { Router } from 'express';
import { DriverController } from '../controllers/driverController';
import { authenticateJwt } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { auditLog } from '../middleware/auditLog';

const router = Router();

router.use(authenticateJwt);
router.use(requireRole(['DRIVER']));

router.get('/dashboard', DriverController.getDashboard);
router.get('/trips', DriverController.getScheduledTrips);
router.get('/trips/scheduled', DriverController.getScheduledTrips);
router.get('/trips/:tripId', DriverController.getTripDetails);
router.get('/trips/:tripId/manifest', DriverController.getManifest);
router.post('/trips/:tripId/start', auditLog('START_TRIP', 'trips'), DriverController.startTrip);
router.post('/trips/:tripId/end', auditLog('END_TRIP', 'trips'), DriverController.endTrip);
router.post('/trips/:tripId/delay', auditLog('REPORT_DELAY', 'trips'), DriverController.reportDelay);
router.patch('/trips/:tripId/passengers/:studentId', auditLog('UPDATE_PASSENGER_STATUS', 'trip_passengers'), DriverController.updatePassengerStatus);

export default router;
