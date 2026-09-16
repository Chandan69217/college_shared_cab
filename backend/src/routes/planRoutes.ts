import { Router } from 'express';
import { PlanController } from '../controllers/planController';
import { authenticateJwt } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { auditLog } from '../middleware/auditLog';

const router = Router();

// Publicly viewable plans
router.get('/', PlanController.getPlans);

// Admin-only plan configuration
router.post('/', authenticateJwt, requireRole(['ADMIN']), auditLog('CREATE_PLAN', 'subscription_plans'), PlanController.createPlan);
router.patch('/:id', authenticateJwt, requireRole(['ADMIN']), auditLog('UPDATE_PLAN', 'subscription_plans'), PlanController.updatePlan);
router.put('/:id', authenticateJwt, requireRole(['ADMIN']), auditLog('UPDATE_PLAN', 'subscription_plans'), PlanController.updatePlan);
router.delete('/:id', authenticateJwt, requireRole(['ADMIN']), auditLog('DELETE_PLAN', 'subscription_plans'), PlanController.deletePlan);

export default router;

