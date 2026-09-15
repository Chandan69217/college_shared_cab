import { Request, Response, NextFunction } from 'express';
import { ProfileService } from '../services/profileService';
import { updateProfileSchema } from '../validators/schemas';
import { sendSuccess } from '../utils/response';

export class ProfileController {
  /**
   * GET /api/v1/profile
   * Retrieve the authenticated user's profile
   */
  public static async getProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const profile = await ProfileService.getProfile(userId);
      sendSuccess(res, 'Profile retrieved successfully.', profile);
    } catch (err) {
      next(err);
    }
  }

  /**
   * PUT/PATCH /api/v1/profile
   * Update editable profile fields
   */
  public static async updateProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const validated = updateProfileSchema.parse(req.body);
      const updated = await ProfileService.updateProfile(userId, validated);
      sendSuccess(res, 'Profile updated successfully.', updated);
    } catch (err) {
      next(err);
    }
  }

  /**
   * DELETE /api/v1/profile
   * Secure account deletion with active operational dependency checks
   */
  public static async deleteProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const result = await ProfileService.deleteProfile(userId);
      sendSuccess(res, result.message, result);
    } catch (err) {
      next(err);
    }
  }
}
