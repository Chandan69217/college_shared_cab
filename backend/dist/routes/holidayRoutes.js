"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const holidayController_1 = require("../controllers/holidayController");
const auth_1 = require("../middleware/auth");
const rbac_1 = require("../middleware/rbac");
const auditLog_1 = require("../middleware/auditLog");
const router = (0, express_1.Router)();
// Publicly view holidays
router.get('/', holidayController_1.HolidayController.getHolidays);
// Admin add holiday
router.post('/', auth_1.authenticateJwt, (0, rbac_1.requireRole)(['ADMIN']), (0, auditLog_1.auditLog)('CREATE_HOLIDAY', 'college_holidays'), holidayController_1.HolidayController.createHoliday);
exports.default = router;
//# sourceMappingURL=holidayRoutes.js.map