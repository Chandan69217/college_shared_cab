"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProfileController = void 0;
const profileService_1 = require("../services/profileService");
const schemas_1 = require("../validators/schemas");
const response_1 = require("../utils/response");
class ProfileController {
    /**
     * GET /api/v1/profile
     * Retrieve the authenticated user's profile
     */
    static async getProfile(req, res, next) {
        try {
            const userId = req.user.userId;
            const profile = await profileService_1.ProfileService.getProfile(userId);
            (0, response_1.sendSuccess)(res, 'Profile retrieved successfully.', profile);
        }
        catch (err) {
            next(err);
        }
    }
    /**
     * PUT/PATCH /api/v1/profile
     * Update editable profile fields
     */
    static async updateProfile(req, res, next) {
        try {
            const userId = req.user.userId;
            const validated = schemas_1.updateProfileSchema.parse(req.body);
            const updated = await profileService_1.ProfileService.updateProfile(userId, validated);
            (0, response_1.sendSuccess)(res, 'Profile updated successfully.', updated);
        }
        catch (err) {
            next(err);
        }
    }
    /**
     * DELETE /api/v1/profile
     * Secure account deletion with active operational dependency checks
     */
    static async deleteProfile(req, res, next) {
        try {
            const userId = req.user.userId;
            const result = await profileService_1.ProfileService.deleteProfile(userId);
            (0, response_1.sendSuccess)(res, result.message, result);
        }
        catch (err) {
            next(err);
        }
    }
}
exports.ProfileController = ProfileController;
//# sourceMappingURL=profileController.js.map