import { Router } from 'express';
import { ProfileController } from '../controllers/profileController';
import { authenticateJwt } from '../middleware/auth';
import { auditLog } from '../middleware/auditLog';

const router = Router();

// All profile endpoints are strictly protected by JWT authentication
router.get('/', authenticateJwt, ProfileController.getProfile);
router.put('/', authenticateJwt, auditLog('UPDATE_PROFILE', 'users'), ProfileController.updateProfile);
router.patch('/', authenticateJwt, auditLog('UPDATE_PROFILE', 'users'), ProfileController.updateProfile);
router.delete('/', authenticateJwt, auditLog('DELETE_PROFILE', 'users'), ProfileController.deleteProfile);

export default router;
