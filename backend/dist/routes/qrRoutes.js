"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const qrController_1 = require("../controllers/qrController");
const auth_1 = require("../middleware/auth");
const rbac_1 = require("../middleware/rbac");
const auditLog_1 = require("../middleware/auditLog");
const router = (0, express_1.Router)();
router.use(auth_1.authenticateJwt);
// Student fetch signed Dynamic QR token for an active pass
router.get('/student/pass/:passId', (0, rbac_1.requireRole)(['STUDENT']), qrController_1.QrController.getStudentQr);
// Driver camera scan validation & boarding confirmation
router.post('/driver/verify-scan', (0, rbac_1.requireRole)(['DRIVER']), (0, auditLog_1.auditLog)('VERIFY_QR_SCAN', 'daily_travel_passes'), qrController_1.QrController.verifyScan);
exports.default = router;
//# sourceMappingURL=qrRoutes.js.map