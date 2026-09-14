import { Router } from 'express';
import { CatalogController } from '../controllers/catalogController';
import { authenticateJwt } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { auditLog } from '../middleware/auditLog';

const router = Router();

// Public / Authenticated read endpoints
router.get('/colleges', CatalogController.getColleges);
router.get('/pickup-points', CatalogController.getPickupPoints);
router.get('/routes', CatalogController.getRoutes);
router.get('/vehicles', CatalogController.getVehicles);

// Admin-only mutation endpoints
router.post('/colleges', authenticateJwt, requireRole(['ADMIN']), auditLog('CREATE_COLLEGE', 'colleges'), CatalogController.createCollege);
router.post('/pickup-points', authenticateJwt, requireRole(['ADMIN']), auditLog('CREATE_PICKUP_POINT', 'pickup_points'), CatalogController.createPickupPoint);
router.post('/routes', authenticateJwt, requireRole(['ADMIN']), auditLog('CREATE_ROUTE', 'routes'), CatalogController.createRoute);
router.post('/vehicles', authenticateJwt, requireRole(['ADMIN']), auditLog('CREATE_VEHICLE', 'vehicles'), CatalogController.createVehicle);

export default router;
