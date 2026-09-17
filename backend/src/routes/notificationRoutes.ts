import { Router } from 'express';
import { NotificationController } from '../controllers/notificationController';
import { authenticateJwt } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';

const router = Router();

// Authenticated user notification routes (Student, Driver, Admin)
router.get('/', authenticateJwt, NotificationController.getUserNotifications);
router.get('/unread-count', authenticateJwt, NotificationController.getUnreadCount);
router.post('/read-all', authenticateJwt, NotificationController.markAllAsRead);
router.post('/device-token', authenticateJwt, NotificationController.registerDeviceToken);
router.delete('/device-token', authenticateJwt, NotificationController.removeDeviceToken);
router.post('/:id/read', authenticateJwt, NotificationController.markAsRead);

export default router;
