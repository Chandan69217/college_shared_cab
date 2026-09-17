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
import profileRoutes from './profileRoutes';
import settingsRoutes from './settingsRoutes';
import notificationRoutes from './notificationRoutes';

const router = Router();

import { authenticateJwt } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { AdminController } from '../controllers/adminController';

router.use('/auth', authRoutes);
router.use('/profile', profileRoutes);
router.use('/students', studentRoutes);
router.use('/student', studentRoutes);
router.use('/drivers', driverRoutes);
router.use('/driver', driverRoutes);
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
router.use('/settings', settingsRoutes);
router.use('/notifications', notificationRoutes);

// Root alias for admin subscriptions
router.get('/subscriptions', authenticateJwt, requireRole(['ADMIN']), AdminController.getSubscriptions);

export default router;
