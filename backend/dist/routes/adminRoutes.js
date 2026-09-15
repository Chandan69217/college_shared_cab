"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const adminController_1 = require("../controllers/adminController");
const catalogController_1 = require("../controllers/catalogController");
const auth_1 = require("../middleware/auth");
const rbac_1 = require("../middleware/rbac");
const auditLog_1 = require("../middleware/auditLog");
const router = (0, express_1.Router)();
router.use(auth_1.authenticateJwt);
router.use((0, rbac_1.requireRole)(['ADMIN']));
// Dashboard & Stats
router.get('/dashboard-stats', adminController_1.AdminController.getDashboardStats);
// Student Management
router.get('/students', adminController_1.AdminController.getStudents);
router.post('/students', (0, auditLog_1.auditLog)('CREATE_STUDENT', 'student_profiles'), adminController_1.AdminController.createStudent);
router.post('/students/bulk-status', (0, auditLog_1.auditLog)('BULK_UPDATE_STUDENTS', 'student_profiles'), adminController_1.AdminController.bulkUpdateStudents);
router.patch('/students/bulk', (0, auditLog_1.auditLog)('BULK_UPDATE_STUDENTS', 'student_profiles'), adminController_1.AdminController.bulkUpdateStudents);
router.patch('/students/:studentId/verification', (0, auditLog_1.auditLog)('VERIFY_STUDENT', 'student_profiles'), adminController_1.AdminController.verifyStudent);
router.put('/students/:studentId', (0, auditLog_1.auditLog)('UPDATE_STUDENT', 'student_profiles'), adminController_1.AdminController.updateStudent);
router.patch('/students/:studentId', (0, auditLog_1.auditLog)('UPDATE_STUDENT', 'student_profiles'), adminController_1.AdminController.updateStudent);
router.delete('/students/:studentId', (0, auditLog_1.auditLog)('DELETE_STUDENT', 'student_profiles'), adminController_1.AdminController.deleteStudent);
// Driver Management
router.get('/drivers', adminController_1.AdminController.getDrivers);
router.post('/drivers', (0, auditLog_1.auditLog)('CREATE_DRIVER', 'driver_profiles'), adminController_1.AdminController.createDriver);
router.put('/drivers/:driverId', (0, auditLog_1.auditLog)('UPDATE_DRIVER', 'driver_profiles'), adminController_1.AdminController.updateDriver);
router.patch('/drivers/:driverId', (0, auditLog_1.auditLog)('UPDATE_DRIVER', 'driver_profiles'), adminController_1.AdminController.updateDriver);
router.delete('/drivers/:driverId', (0, auditLog_1.auditLog)('DELETE_DRIVER', 'driver_profiles'), adminController_1.AdminController.deleteDriver);
// College Management (Admin Mutations)
router.get('/colleges', catalogController_1.CatalogController.getColleges);
router.post('/colleges', (0, auditLog_1.auditLog)('CREATE_COLLEGE', 'colleges'), catalogController_1.CatalogController.createCollege);
router.put('/colleges/:collegeId', (0, auditLog_1.auditLog)('UPDATE_COLLEGE', 'colleges'), catalogController_1.CatalogController.updateCollege);
router.patch('/colleges/:collegeId', (0, auditLog_1.auditLog)('UPDATE_COLLEGE', 'colleges'), catalogController_1.CatalogController.updateCollege);
router.delete('/colleges/:collegeId', (0, auditLog_1.auditLog)('DELETE_COLLEGE', 'colleges'), catalogController_1.CatalogController.deleteCollege);
// Pickup Point Management (Admin Mutations)
router.get('/pickup-points', catalogController_1.CatalogController.getPickupPoints);
router.post('/pickup-points', (0, auditLog_1.auditLog)('CREATE_PICKUP_POINT', 'pickup_points'), catalogController_1.CatalogController.createPickupPoint);
router.put('/pickup-points/:pointId', (0, auditLog_1.auditLog)('UPDATE_PICKUP_POINT', 'pickup_points'), catalogController_1.CatalogController.updatePickupPoint);
router.patch('/pickup-points/:pointId', (0, auditLog_1.auditLog)('UPDATE_PICKUP_POINT', 'pickup_points'), catalogController_1.CatalogController.updatePickupPoint);
router.delete('/pickup-points/:pointId', (0, auditLog_1.auditLog)('DELETE_PICKUP_POINT', 'pickup_points'), catalogController_1.CatalogController.deletePickupPoint);
// Vehicle Management (Admin Mutations)
router.get('/vehicles', catalogController_1.CatalogController.getVehicles);
router.post('/vehicles', (0, auditLog_1.auditLog)('CREATE_VEHICLE', 'vehicles'), catalogController_1.CatalogController.createVehicle);
router.put('/vehicles/:vehicleId', (0, auditLog_1.auditLog)('UPDATE_VEHICLE', 'vehicles'), adminController_1.AdminController.updateVehicle);
router.patch('/vehicles/:vehicleId', (0, auditLog_1.auditLog)('UPDATE_VEHICLE', 'vehicles'), adminController_1.AdminController.updateVehicle);
router.delete('/vehicles/:vehicleId', (0, auditLog_1.auditLog)('DELETE_VEHICLE', 'vehicles'), adminController_1.AdminController.deleteVehicle);
// Route Management (Admin Mutations)
router.get('/routes', catalogController_1.CatalogController.getRoutes);
router.post('/routes', (0, auditLog_1.auditLog)('CREATE_ROUTE', 'routes'), catalogController_1.CatalogController.createRoute);
router.put('/routes/:routeId', (0, auditLog_1.auditLog)('UPDATE_ROUTE', 'routes'), adminController_1.AdminController.updateRoute);
router.patch('/routes/:routeId', (0, auditLog_1.auditLog)('UPDATE_ROUTE', 'routes'), adminController_1.AdminController.updateRoute);
router.delete('/routes/:routeId', (0, auditLog_1.auditLog)('DELETE_ROUTE', 'routes'), adminController_1.AdminController.deleteRoute);
// Centralized Assignment Management
router.get('/assignments', adminController_1.AdminController.getAssignments);
router.post('/assignments/route-allocation', (0, auditLog_1.auditLog)('ALLOCATE_ROUTE_RESOURCES', 'routes'), adminController_1.AdminController.allocateRouteResources);
router.put('/assignments/:routeId', (0, auditLog_1.auditLog)('ALLOCATE_ROUTE_RESOURCES', 'routes'), adminController_1.AdminController.allocateRouteResources);
// Admin Profile & RBAC
router.get('/admins', adminController_1.AdminController.getAdmins);
router.post('/admins', (0, auditLog_1.auditLog)('CREATE_ADMIN', 'admin_profiles'), adminController_1.AdminController.createAdmin);
router.post('/admin-profile', (0, auditLog_1.auditLog)('CREATE_ADMIN_PROFILE', 'admin_profiles'), adminController_1.AdminController.createAdminProfile);
router.post('/profiles', (0, auditLog_1.auditLog)('CREATE_ADMIN_PROFILE', 'admin_profiles'), adminController_1.AdminController.createAdminProfile);
router.get('/profile', adminController_1.AdminController.getAdminProfile);
router.patch('/profile', (0, auditLog_1.auditLog)('UPDATE_ADMIN_PROFILE', 'admin_profiles'), adminController_1.AdminController.updateAdminProfile);
router.put('/profile', (0, auditLog_1.auditLog)('UPDATE_ADMIN_PROFILE', 'admin_profiles'), adminController_1.AdminController.updateAdminProfile);
router.get('/subscriptions', adminController_1.AdminController.getSubscriptions);
router.get('/audit-logs', adminController_1.AdminController.getAuditLogs);
exports.default = router;
//# sourceMappingURL=adminRoutes.js.map