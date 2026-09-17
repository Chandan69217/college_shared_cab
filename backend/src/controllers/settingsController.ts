import { Request, Response, NextFunction } from 'express';
import { SettingsRepository } from '../repositories/settingsRepository';
import { sendSuccess } from '../utils/response';

export class SettingsController {
  /**
   * Get all active system configuration settings
   */
  public static async getSettings(req: Request, res: Response, next: NextFunction) {
    try {
      const settings = await SettingsRepository.getAll();
      sendSuccess(res, 'System settings retrieved successfully.', settings);
    } catch (err) {
      next(err);
    }
  }

  /**
   * Update system settings (Admin only)
   */
  public static async updateSettings(req: Request, res: Response, next: NextFunction) {
    try {
      const updates = req.body;
      const updated = await SettingsRepository.update(updates);
      sendSuccess(res, 'System settings updated successfully.', updated);
    } catch (err) {
      next(err);
    }
  }
}
