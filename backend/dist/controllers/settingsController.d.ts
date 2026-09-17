import { Request, Response, NextFunction } from 'express';
export declare class SettingsController {
    /**
     * Get all active system configuration settings
     */
    static getSettings(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * Update system settings (Admin only)
     */
    static updateSettings(req: Request, res: Response, next: NextFunction): Promise<void>;
}
