"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const profileController_1 = require("../controllers/profileController");
const auth_1 = require("../middleware/auth");
const auditLog_1 = require("../middleware/auditLog");
const router = (0, express_1.Router)();
// All profile endpoints are strictly protected by JWT authentication
router.get('/', auth_1.authenticateJwt, profileController_1.ProfileController.getProfile);
router.put('/', auth_1.authenticateJwt, (0, auditLog_1.auditLog)('UPDATE_PROFILE', 'users'), profileController_1.ProfileController.updateProfile);
router.patch('/', auth_1.authenticateJwt, (0, auditLog_1.auditLog)('UPDATE_PROFILE', 'users'), profileController_1.ProfileController.updateProfile);
router.delete('/', auth_1.authenticateJwt, (0, auditLog_1.auditLog)('DELETE_PROFILE', 'users'), profileController_1.ProfileController.deleteProfile);
exports.default = router;
//# sourceMappingURL=profileRoutes.js.map