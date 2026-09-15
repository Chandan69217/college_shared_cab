import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { authenticateJwt } from '../middleware/auth';
import { authRateLimiter } from '../middleware/rateLimiter';

const router = Router();

router.post('/register', authRateLimiter, AuthController.registerStudent);
router.post('/register-student', authRateLimiter, AuthController.registerStudent);
router.post('/register-admin', authRateLimiter, AuthController.registerAdmin);
router.post('/login', authRateLimiter, AuthController.login);
router.post('/change-password', authenticateJwt, AuthController.changePassword);
router.post('/forgot-password', authRateLimiter, AuthController.forgotPassword);
router.post('/verify-otp', authRateLimiter, AuthController.verifyOtp);
router.post('/reset-password', authRateLimiter, AuthController.resetPassword);
router.post('/otp/request', authRateLimiter, AuthController.requestOtp);
router.post('/otp/verify', authRateLimiter, AuthController.verifyOtp);
router.get('/me', authenticateJwt, AuthController.me);

export default router;
