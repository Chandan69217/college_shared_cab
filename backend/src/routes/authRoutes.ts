import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { authenticateJwt } from '../middleware/auth';
import { authRateLimiter } from '../middleware/rateLimiter';

const router = Router();

router.post('/register', authRateLimiter, AuthController.registerStudent);
router.post('/login', authRateLimiter, AuthController.login);
router.post('/otp/request', authRateLimiter, AuthController.requestOtp);
router.post('/otp/verify', authRateLimiter, AuthController.verifyOtp);
router.get('/me', authenticateJwt, AuthController.me);

export default router;
