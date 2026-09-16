import { Router } from 'express';
import { TripController } from '../controllers/tripController';
import { authenticateJwt } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { auditLog } from '../middleware/auditLog';

const router = Router();

router.use(authenticateJwt);

// Read trips & locations
router.get('/', TripController.getTrips);
router.get('/active-locations', TripController.getAllActiveLocations);
router.get('/:id/location', TripController.getTripLocation);
router.get('/:tripId/location', TripController.getTripLocation);
router.get('/:id/history', requireRole(['ADMIN', 'DRIVER']), TripController.getTripHistory);
router.get('/:tripId/history', requireRole(['ADMIN', 'DRIVER']), TripController.getTripHistory);

// Driver Trip Lifecycle & Live GPS
router.post('/location', requireRole(['DRIVER']), TripController.updateLocation);
router.post('/:tripId/location', requireRole(['DRIVER']), TripController.updateLocation);
router.post('/:tripId/start', requireRole(['DRIVER']), auditLog('START_TRIP', 'trips'), TripController.startTrip);
router.post('/:tripId/end', requireRole(['DRIVER']), auditLog('END_TRIP', 'trips'), TripController.endTrip);

// Admin schedule trip
router.post('/', requireRole(['ADMIN']), auditLog('SCHEDULE_TRIP', 'trips'), TripController.createTrip);

export default router;
