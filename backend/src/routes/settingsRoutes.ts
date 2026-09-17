import { Router } from 'express';
import { SettingsController } from '../controllers/settingsController';
import { authenticateJwt } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';

const router = Router();

// Read active configuration
router.get('/', SettingsController.getSettings);

// Update configuration (Admin only)
router.put('/', authenticateJwt, requireRole(['ADMIN']), SettingsController.updateSettings);
router.patch('/', authenticateJwt, requireRole(['ADMIN']), SettingsController.updateSettings);

export default router;
