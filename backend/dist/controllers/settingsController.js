"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SettingsController = void 0;
const settingsRepository_1 = require("../repositories/settingsRepository");
const response_1 = require("../utils/response");
class SettingsController {
    /**
     * Get all active system configuration settings
     */
    static async getSettings(req, res, next) {
        try {
            const settings = await settingsRepository_1.SettingsRepository.getAll();
            (0, response_1.sendSuccess)(res, 'System settings retrieved successfully.', settings);
        }
        catch (err) {
            next(err);
        }
    }
    /**
     * Update system settings (Admin only)
     */
    static async updateSettings(req, res, next) {
        try {
            const updates = req.body;
            const updated = await settingsRepository_1.SettingsRepository.update(updates);
            (0, response_1.sendSuccess)(res, 'System settings updated successfully.', updated);
        }
        catch (err) {
            next(err);
        }
    }
}
exports.SettingsController = SettingsController;
//# sourceMappingURL=settingsController.js.map