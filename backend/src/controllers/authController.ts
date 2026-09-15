import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/authService';
import {
  loginSchema,
  registerStudentSchema,
  requestOtpSchema,
  verifyOtpSchema,
  createAdminSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  verifyRecoveryOtpSchema,
  resetPasswordSchema,
} from '../validators/schemas';
import { sendSuccess } from '../utils/response';

export class AuthController {
  public static async registerStudent(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = registerStudentSchema.parse(req.body);
      const result = await AuthService.registerStudent(validated);
      sendSuccess(res, 'Student registration successful.', result, 201);
    } catch (err) {
      next(err);
    }
  }

  public static async registerAdmin(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = createAdminSchema.parse(req.body);
      const result = await AuthService.registerAdmin(validated);
      sendSuccess(res, 'Admin registration successful.', result, 201);
    } catch (err) {
      next(err);
    }
  }

  public static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = loginSchema.parse(req.body);
      const result = await AuthService.login(validated.emailOrPhone, validated.password, validated.role);
      sendSuccess(res, 'Login successful.', result);
    } catch (err) {
      next(err);
    }
  }

  public static async changePassword(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const validated = changePasswordSchema.parse(req.body);
      const result = await AuthService.changePassword(userId, validated.currentPassword, validated.newPassword);
      sendSuccess(res, result.message, null);
    } catch (err) {
      next(err);
    }
  }

  public static async forgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = forgotPasswordSchema.parse(req.body);
      const identifier = validated.identifier || validated.emailOrPhone || validated.email || validated.phone;
      const result = await AuthService.forgotPassword(identifier, undefined, validated.role);
      sendSuccess(res, result.message, { cooldownSeconds: result.cooldownSeconds });
    } catch (err) {
      next(err);
    }
  }

  public static async verifyOtp(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = verifyRecoveryOtpSchema.parse(req.body);
      const identifier = (validated.identifier || validated.emailOrPhone)!;
      const result = await AuthService.verifyRecoveryOtp(identifier, validated.otp, validated.purpose, validated.role);
      sendSuccess(res, result.message, { resetToken: result.resetToken });
    } catch (err) {
      next(err);
    }
  }

  public static async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = resetPasswordSchema.parse(req.body);
      const identifier = (validated.identifier || validated.emailOrPhone)!;
      const result = await AuthService.resetPassword(identifier, validated.resetToken, validated.newPassword, validated.role);
      sendSuccess(res, result.message, null);
    } catch (err) {
      next(err);
    }
  }

  public static async requestOtp(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = requestOtpSchema.parse(req.body);
      const result = await AuthService.requestOtp(validated.phone);
      sendSuccess(res, result.message, result);
    } catch (err) {
      next(err);
    }
  }

  public static async me(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const result = await AuthService.getCurrentUser(userId);
      sendSuccess(res, 'Profile retrieved successfully.', result);
    } catch (err) {
      next(err);
    }
  }
}
