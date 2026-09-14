"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const reportController_1 = require("../controllers/reportController");
const auth_1 = require("../middleware/auth");
const rbac_1 = require("../middleware/rbac");
const router = (0, express_1.Router)();
router.use(auth_1.authenticateJwt);
router.use((0, rbac_1.requireRole)(['ADMIN']));
router.get('/', reportController_1.ReportController.getReports);
exports.default = router;
//# sourceMappingURL=reportRoutes.js.map