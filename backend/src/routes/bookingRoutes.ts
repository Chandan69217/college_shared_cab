import { Router } from 'express';
import { BookingController } from '../controllers/bookingController';
import { authenticateJwt } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { auditLog } from '../middleware/auditLog';

const router = Router();

router.use(authenticateJwt);

// Student booking actions
router.post('/', requireRole(['STUDENT']), auditLog('BOOK_RIDE', 'bookings'), BookingController.bookRide);
router.post('/:id/cancel', requireRole(['STUDENT']), auditLog('CANCEL_BOOKING', 'bookings'), BookingController.cancelBooking);

// Admin view all bookings
router.get('/', requireRole(['ADMIN']), BookingController.getAllBookings);

export default router;
