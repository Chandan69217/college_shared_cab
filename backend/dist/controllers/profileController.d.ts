import { Request, Response, NextFunction } from 'express';
export declare class ProfileController {
    /**
     * GET /api/v1/profile
     * Retrieve the authenticated user's profile
     */
    static getProfile(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * PUT/PATCH /api/v1/profile
     * Update editable profile fields
     */
    static updateProfile(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * DELETE /api/v1/profile
     * Secure account deletion with active operational dependency checks
     */
    static deleteProfile(req: Request, res: Response, next: NextFunction): Promise<void>;
}
