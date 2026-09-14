import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/authService';
import { loginSchema, registerStudentSchema, requestOtpSchema, verifyOtpSchema } from '../validators/schemas';
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

  public static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = loginSchema.parse(req.body);
      const result = await AuthService.login(validated.emailOrPhone, validated.password, validated.role);
      sendSuccess(res, 'Login successful.', result);
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

  public static async verifyOtp(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = verifyOtpSchema.parse(req.body);
      const result = await AuthService.verifyOtp(validated.phone, validated.otp);
      sendSuccess(res, 'OTP verified successfully.', result);
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
