import { Router } from 'express';
import { AdminController } from '../controllers/adminController';
import { CatalogController } from '../controllers/catalogController';
import { authenticateJwt } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { auditLog } from '../middleware/auditLog';

const router = Router();

router.use(authenticateJwt);
router.use(requireRole(['ADMIN']));

// Dashboard & Stats
router.get('/dashboard-stats', AdminController.getDashboardStats);

// Student Management
router.get('/students', AdminController.getStudents);
router.post('/students', auditLog('CREATE_STUDENT', 'student_profiles'), AdminController.createStudent);
router.post('/students/bulk-status', auditLog('BULK_UPDATE_STUDENTS', 'student_profiles'), AdminController.bulkUpdateStudents);
router.patch('/students/bulk', auditLog('BULK_UPDATE_STUDENTS', 'student_profiles'), AdminController.bulkUpdateStudents);
router.patch('/students/:studentId/verification', auditLog('VERIFY_STUDENT', 'student_profiles'), AdminController.verifyStudent);
router.put('/students/:studentId', auditLog('UPDATE_STUDENT', 'student_profiles'), AdminController.updateStudent);
router.patch('/students/:studentId', auditLog('UPDATE_STUDENT', 'student_profiles'), AdminController.updateStudent);
router.delete('/students/:studentId', auditLog('DELETE_STUDENT', 'student_profiles'), AdminController.deleteStudent);

// Driver Management
router.get('/drivers', AdminController.getDrivers);
router.post('/drivers', auditLog('CREATE_DRIVER', 'driver_profiles'), AdminController.createDriver);
router.put('/drivers/:driverId', auditLog('UPDATE_DRIVER', 'driver_profiles'), AdminController.updateDriver);
router.patch('/drivers/:driverId', auditLog('UPDATE_DRIVER', 'driver_profiles'), AdminController.updateDriver);
router.delete('/drivers/:driverId', auditLog('DELETE_DRIVER', 'driver_profiles'), AdminController.deleteDriver);

// College Management (Admin Mutations)
router.get('/colleges', CatalogController.getColleges);
router.post('/colleges', auditLog('CREATE_COLLEGE', 'colleges'), CatalogController.createCollege);
router.put('/colleges/:collegeId', auditLog('UPDATE_COLLEGE', 'colleges'), CatalogController.updateCollege);
router.patch('/colleges/:collegeId', auditLog('UPDATE_COLLEGE', 'colleges'), CatalogController.updateCollege);
router.delete('/colleges/:collegeId', auditLog('DELETE_COLLEGE', 'colleges'), CatalogController.deleteCollege);

// Pickup Point Management (Admin Mutations)
router.get('/pickup-points', CatalogController.getPickupPoints);
router.post('/pickup-points', auditLog('CREATE_PICKUP_POINT', 'pickup_points'), CatalogController.createPickupPoint);
router.put('/pickup-points/:pointId', auditLog('UPDATE_PICKUP_POINT', 'pickup_points'), CatalogController.updatePickupPoint);
router.patch('/pickup-points/:pointId', auditLog('UPDATE_PICKUP_POINT', 'pickup_points'), CatalogController.updatePickupPoint);
router.delete('/pickup-points/:pointId', auditLog('DELETE_PICKUP_POINT', 'pickup_points'), CatalogController.deletePickupPoint);

// Vehicle Management (Admin Mutations)
router.get('/vehicles', CatalogController.getVehicles);
router.post('/vehicles', auditLog('CREATE_VEHICLE', 'vehicles'), CatalogController.createVehicle);
router.put('/vehicles/:vehicleId', auditLog('UPDATE_VEHICLE', 'vehicles'), AdminController.updateVehicle);
router.patch('/vehicles/:vehicleId', auditLog('UPDATE_VEHICLE', 'vehicles'), AdminController.updateVehicle);
router.delete('/vehicles/:vehicleId', auditLog('DELETE_VEHICLE', 'vehicles'), AdminController.deleteVehicle);

// Route Management (Admin Mutations)
router.get('/routes', CatalogController.getRoutes);
router.post('/routes', auditLog('CREATE_ROUTE', 'routes'), CatalogController.createRoute);
router.put('/routes/:routeId', auditLog('UPDATE_ROUTE', 'routes'), AdminController.updateRoute);
router.patch('/routes/:routeId', auditLog('UPDATE_ROUTE', 'routes'), AdminController.updateRoute);
router.delete('/routes/:routeId', auditLog('DELETE_ROUTE', 'routes'), AdminController.deleteRoute);

// Centralized Assignment Management
router.get('/assignments', AdminController.getAssignments);
router.post('/assignments/route-allocation', auditLog('ALLOCATE_ROUTE_RESOURCES', 'routes'), AdminController.allocateRouteResources);
router.put('/assignments/:routeId', auditLog('ALLOCATE_ROUTE_RESOURCES', 'routes'), AdminController.allocateRouteResources);

// Admin Profile & RBAC
router.get('/admins', AdminController.getAdmins);
router.post('/admins', auditLog('CREATE_ADMIN', 'admin_profiles'), AdminController.createAdmin);
router.post('/admin-profile', auditLog('CREATE_ADMIN_PROFILE', 'admin_profiles'), AdminController.createAdminProfile);
router.post('/profiles', auditLog('CREATE_ADMIN_PROFILE', 'admin_profiles'), AdminController.createAdminProfile);
router.get('/profile', AdminController.getAdminProfile);
router.patch('/profile', auditLog('UPDATE_ADMIN_PROFILE', 'admin_profiles'), AdminController.updateAdminProfile);
router.put('/profile', auditLog('UPDATE_ADMIN_PROFILE', 'admin_profiles'), AdminController.updateAdminProfile);
router.get('/subscriptions', AdminController.getSubscriptions);
router.get('/audit-logs', AdminController.getAuditLogs);

export default router;

