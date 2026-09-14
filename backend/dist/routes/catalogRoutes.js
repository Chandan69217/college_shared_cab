"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const catalogController_1 = require("../controllers/catalogController");
const auth_1 = require("../middleware/auth");
const rbac_1 = require("../middleware/rbac");
const auditLog_1 = require("../middleware/auditLog");
const router = (0, express_1.Router)();
// Public / Authenticated read endpoints
router.get('/colleges', catalogController_1.CatalogController.getColleges);
router.get('/pickup-points', catalogController_1.CatalogController.getPickupPoints);
router.get('/routes', catalogController_1.CatalogController.getRoutes);
router.get('/vehicles', catalogController_1.CatalogController.getVehicles);
// Admin-only mutation endpoints
router.post('/colleges', auth_1.authenticateJwt, (0, rbac_1.requireRole)(['ADMIN']), (0, auditLog_1.auditLog)('CREATE_COLLEGE', 'colleges'), catalogController_1.CatalogController.createCollege);
router.post('/pickup-points', auth_1.authenticateJwt, (0, rbac_1.requireRole)(['ADMIN']), (0, auditLog_1.auditLog)('CREATE_PICKUP_POINT', 'pickup_points'), catalogController_1.CatalogController.createPickupPoint);
router.post('/routes', auth_1.authenticateJwt, (0, rbac_1.requireRole)(['ADMIN']), (0, auditLog_1.auditLog)('CREATE_ROUTE', 'routes'), catalogController_1.CatalogController.createRoute);
router.post('/vehicles', auth_1.authenticateJwt, (0, rbac_1.requireRole)(['ADMIN']), (0, auditLog_1.auditLog)('CREATE_VEHICLE', 'vehicles'), catalogController_1.CatalogController.createVehicle);
exports.default = router;
//# sourceMappingURL=catalogRoutes.js.map