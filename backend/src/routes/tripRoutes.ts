import { Router } from 'express';
import { TripController } from '../controllers/tripController';
import { authenticateJwt } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { auditLog } from '../middleware/auditLog';

const router = Router();

router.use(authenticateJwt);

// Read trips
router.get('/', TripController.getTrips);
router.get('/active-locations', TripController.getAllActiveLocations);
router.get('/:id/location', TripController.getTripLocation);

// Driver update live GPS coordinates
router.post('/location', requireRole(['DRIVER']), TripController.updateLocation);

// Admin schedule trip
router.post('/', requireRole(['ADMIN']), auditLog('SCHEDULE_TRIP', 'trips'), TripController.createTrip);

export default router;
