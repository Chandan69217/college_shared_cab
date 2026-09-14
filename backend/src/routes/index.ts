import { Router } from 'express';
import authRoutes from './authRoutes';
import studentRoutes from './studentRoutes';
import driverRoutes from './driverRoutes';
import adminRoutes from './adminRoutes';
import catalogRoutes from './catalogRoutes';
import planRoutes from './planRoutes';
import bookingRoutes from './bookingRoutes';
import qrRoutes from './qrRoutes';
import tripRoutes from './tripRoutes';
import paymentRoutes from './paymentRoutes';
import complaintRoutes from './complaintRoutes';
import reportRoutes from './reportRoutes';
import holidayRoutes from './holidayRoutes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/students', studentRoutes);
router.use('/drivers', driverRoutes);
router.use('/admin', adminRoutes);
router.use('/catalog', catalogRoutes);
router.use('/plans', planRoutes);
router.use('/bookings', bookingRoutes);
router.use('/qr', qrRoutes);
router.use('/trips', tripRoutes);
router.use('/payments', paymentRoutes);
router.use('/complaints', complaintRoutes);
router.use('/reports', reportRoutes);
router.use('/holidays', holidayRoutes);

export default router;
