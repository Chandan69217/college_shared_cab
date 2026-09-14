"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const driverController_1 = require("../controllers/driverController");
const auth_1 = require("../middleware/auth");
const rbac_1 = require("../middleware/rbac");
const auditLog_1 = require("../middleware/auditLog");
const router = (0, express_1.Router)();
router.use(auth_1.authenticateJwt);
router.use((0, rbac_1.requireRole)(['DRIVER']));
router.get('/dashboard', driverController_1.DriverController.getDashboard);
router.get('/trips/:tripId/manifest', driverController_1.DriverController.getManifest);
router.post('/trips/:tripId/start', (0, auditLog_1.auditLog)('START_TRIP', 'trips'), driverController_1.DriverController.startTrip);
router.post('/trips/:tripId/end', (0, auditLog_1.auditLog)('END_TRIP', 'trips'), driverController_1.DriverController.endTrip);
exports.default = router;
//# sourceMappingURL=driverRoutes.js.map