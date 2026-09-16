"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const planController_1 = require("../controllers/planController");
const auth_1 = require("../middleware/auth");
const rbac_1 = require("../middleware/rbac");
const auditLog_1 = require("../middleware/auditLog");
const router = (0, express_1.Router)();
// Publicly viewable plans
router.get('/', planController_1.PlanController.getPlans);
// Admin-only plan configuration
router.post('/', auth_1.authenticateJwt, (0, rbac_1.requireRole)(['ADMIN']), (0, auditLog_1.auditLog)('CREATE_PLAN', 'subscription_plans'), planController_1.PlanController.createPlan);
router.patch('/:id', auth_1.authenticateJwt, (0, rbac_1.requireRole)(['ADMIN']), (0, auditLog_1.auditLog)('UPDATE_PLAN', 'subscription_plans'), planController_1.PlanController.updatePlan);
router.put('/:id', auth_1.authenticateJwt, (0, rbac_1.requireRole)(['ADMIN']), (0, auditLog_1.auditLog)('UPDATE_PLAN', 'subscription_plans'), planController_1.PlanController.updatePlan);
router.delete('/:id', auth_1.authenticateJwt, (0, rbac_1.requireRole)(['ADMIN']), (0, auditLog_1.auditLog)('DELETE_PLAN', 'subscription_plans'), planController_1.PlanController.deletePlan);
exports.default = router;
//# sourceMappingURL=planRoutes.js.map