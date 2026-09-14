"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const adminController_1 = require("../controllers/adminController");
const auth_1 = require("../middleware/auth");
const rbac_1 = require("../middleware/rbac");
const auditLog_1 = require("../middleware/auditLog");
const router = (0, express_1.Router)();
router.use(auth_1.authenticateJwt);
router.use((0, rbac_1.requireRole)(['ADMIN']));
router.get('/dashboard-stats', adminController_1.AdminController.getDashboardStats);
router.get('/students', adminController_1.AdminController.getStudents);
router.patch('/students/:studentId/verification', (0, auditLog_1.auditLog)('VERIFY_STUDENT', 'student_profiles'), adminController_1.AdminController.verifyStudent);
router.get('/drivers', adminController_1.AdminController.getDrivers);
router.post('/drivers', (0, auditLog_1.auditLog)('CREATE_DRIVER', 'driver_profiles'), adminController_1.AdminController.createDriver);
router.get('/audit-logs', adminController_1.AdminController.getAuditLogs);
exports.default = router;
//# sourceMappingURL=adminRoutes.js.map