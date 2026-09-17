"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const settingsController_1 = require("../controllers/settingsController");
const auth_1 = require("../middleware/auth");
const rbac_1 = require("../middleware/rbac");
const router = (0, express_1.Router)();
// Read active configuration
router.get('/', settingsController_1.SettingsController.getSettings);
// Update configuration (Admin only)
router.put('/', auth_1.authenticateJwt, (0, rbac_1.requireRole)(['ADMIN']), settingsController_1.SettingsController.updateSettings);
router.patch('/', auth_1.authenticateJwt, (0, rbac_1.requireRole)(['ADMIN']), settingsController_1.SettingsController.updateSettings);
exports.default = router;
//# sourceMappingURL=settingsRoutes.js.map