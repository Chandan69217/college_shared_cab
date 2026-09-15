"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminController = void 0;
const adminService_1 = require("../services/adminService");
const userRepository_1 = require("../repositories/userRepository");
const subscriptionRepository_1 = require("../repositories/subscriptionRepository");
const response_1 = require("../utils/response");
const supabaseClient_1 = require("../database/supabaseClient");
const schemas_1 = require("../validators/schemas");
class AdminController {
    static async getDashboardStats(req, res, next) {
        try {
            const stats = await adminService_1.AdminService.getDashboardStats();
            (0, response_1.sendSuccess)(res, 'Admin stats retrieved.', stats);
        }
        catch (err) {
            next(err);
        }
    }
    static async getStudents(req, res, next) {
        try {
            const students = await userRepository_1.UserRepository.getAllStudents();
            (0, response_1.sendSuccess)(res, 'Students list retrieved.', students);
        }
        catch (err) {
            next(err);
        }
    }
    static async verifyStudent(req, res, next) {
        try {
            const studentId = req.params.studentId;
            const { status, notes } = req.body;
            const adminId = req.user.userId;
            const profile = await adminService_1.AdminService.updateStudentVerification(studentId, status, adminId, notes);
            (0, response_1.sendSuccess)(res, `Student status updated to ${status}.`, profile);
        }
        catch (err) {
            next(err);
        }
    }
    static async getDrivers(req, res, next) {
        try {
            const drivers = await userRepository_1.UserRepository.getAllDrivers();
            (0, response_1.sendSuccess)(res, 'Drivers list retrieved.', drivers);
        }
        catch (err) {
            next(err);
        }
    }
    static async createDriver(req, res, next) {
        try {
            const result = await adminService_1.AdminService.createDriver(req.body);
            (0, response_1.sendSuccess)(res, 'Driver created successfully.', result, 201);
        }
        catch (err) {
            next(err);
        }
    }
    static async getAdmins(req, res, next) {
        try {
            const admins = await userRepository_1.UserRepository.getAllAdmins();
            (0, response_1.sendSuccess)(res, 'Admins list retrieved.', admins);
        }
        catch (err) {
            next(err);
        }
    }
    static async createAdmin(req, res, next) {
        try {
            const validated = schemas_1.createAdminSchema.parse(req.body);
            const result = await adminService_1.AdminService.createAdmin(validated);
            (0, response_1.sendSuccess)(res, 'Admin created successfully.', result, 201);
        }
        catch (err) {
            next(err);
        }
    }
    static async createAdminProfile(req, res, next) {
        try {
            const validated = schemas_1.createAdminProfileSchema.parse(req.body);
            const targetUserId = validated.user_id || req.user?.userId;
            if (!targetUserId) {
                const err = new Error('User ID is required.');
                err.statusCode = 400;
                throw err;
            }
            const profile = await adminService_1.AdminService.createOrUpdateAdminProfile(targetUserId, validated);
            (0, response_1.sendSuccess)(res, 'Admin profile created/updated successfully.', profile, 201);
        }
        catch (err) {
            next(err);
        }
    }
    static async getAdminProfile(req, res, next) {
        try {
            const userId = req.user.userId;
            const profile = await userRepository_1.UserRepository.getAdminProfile(userId);
            (0, response_1.sendSuccess)(res, 'Admin profile retrieved.', profile);
        }
        catch (err) {
            next(err);
        }
    }
    static async updateAdminProfile(req, res, next) {
        try {
            const userId = req.user.userId;
            const validated = schemas_1.updateAdminProfileSchema.parse(req.body);
            const profile = await userRepository_1.UserRepository.updateAdminProfile(userId, validated);
            (0, response_1.sendSuccess)(res, 'Admin profile updated.', profile);
        }
        catch (err) {
            next(err);
        }
    }
    static async createStudent(req, res, next) {
        try {
            const result = await adminService_1.AdminService.createStudent(req.body);
            (0, response_1.sendSuccess)(res, 'Student created successfully.', result, 201);
        }
        catch (err) {
            next(err);
        }
    }
    static async updateStudent(req, res, next) {
        try {
            const studentId = req.params.studentId || req.params.id;
            const updated = await adminService_1.AdminService.updateStudent(studentId, req.body);
            (0, response_1.sendSuccess)(res, 'Student updated successfully.', updated);
        }
        catch (err) {
            next(err);
        }
    }
    static async deleteStudent(req, res, next) {
        try {
            const studentId = req.params.studentId || req.params.id;
            await adminService_1.AdminService.deleteStudent(studentId);
            (0, response_1.sendSuccess)(res, 'Student deleted successfully.');
        }
        catch (err) {
            next(err);
        }
    }
    static async bulkUpdateStudents(req, res, next) {
        try {
            const studentIds = req.body.student_ids || req.body.userIds || [];
            const { action, notes, updates } = req.body;
            const result = await adminService_1.AdminService.bulkUpdateStudents(studentIds, action, notes, updates);
            (0, response_1.sendSuccess)(res, `Bulk operation completed for ${result.processedCount} students.`, result);
        }
        catch (err) {
            next(err);
        }
    }
    static async updateDriver(req, res, next) {
        try {
            const driverId = req.params.driverId || req.params.id;
            const updated = await adminService_1.AdminService.updateDriver(driverId, req.body);
            (0, response_1.sendSuccess)(res, 'Driver updated successfully.', updated);
        }
        catch (err) {
            next(err);
        }
    }
    static async deleteDriver(req, res, next) {
        try {
            const driverId = req.params.driverId || req.params.id;
            await adminService_1.AdminService.deleteDriver(driverId);
            (0, response_1.sendSuccess)(res, 'Driver deleted successfully.');
        }
        catch (err) {
            next(err);
        }
    }
    static async updateVehicle(req, res, next) {
        try {
            const vehicleId = req.params.vehicleId || req.params.id;
            const updated = await adminService_1.AdminService.updateVehicle(vehicleId, req.body);
            (0, response_1.sendSuccess)(res, 'Vehicle updated successfully.', updated);
        }
        catch (err) {
            next(err);
        }
    }
    static async deleteVehicle(req, res, next) {
        try {
            const vehicleId = req.params.vehicleId || req.params.id;
            await adminService_1.AdminService.deleteVehicle(vehicleId);
            (0, response_1.sendSuccess)(res, 'Vehicle deleted successfully.');
        }
        catch (err) {
            next(err);
        }
    }
    static async updateRoute(req, res, next) {
        try {
            const routeId = req.params.routeId || req.params.id;
            const { stops, ...routeData } = req.body;
            const updated = await adminService_1.AdminService.updateRoute(routeId, routeData, stops);
            (0, response_1.sendSuccess)(res, 'Route updated successfully.', updated);
        }
        catch (err) {
            next(err);
        }
    }
    static async deleteRoute(req, res, next) {
        try {
            const routeId = req.params.routeId || req.params.id;
            await adminService_1.AdminService.deleteRoute(routeId);
            (0, response_1.sendSuccess)(res, 'Route deleted successfully.');
        }
        catch (err) {
            next(err);
        }
    }
    static async getAssignments(req, res, next) {
        try {
            const assignments = await adminService_1.AdminService.getAssignmentsSummary();
            (0, response_1.sendSuccess)(res, 'Assignments matrix retrieved.', assignments);
        }
        catch (err) {
            next(err);
        }
    }
    static async allocateRouteResources(req, res, next) {
        try {
            const { route_id, default_vehicle_id, default_driver_id } = req.body;
            const updated = await adminService_1.AdminService.allocateRouteResources(route_id, {
                default_vehicle_id,
                default_driver_id,
            });
            (0, response_1.sendSuccess)(res, 'Route resource allocation updated successfully.', updated);
        }
        catch (err) {
            next(err);
        }
    }
    static async getSubscriptions(req, res, next) {
        try {
            const subscriptions = await subscriptionRepository_1.SubscriptionRepository.findAll();
            (0, response_1.sendSuccess)(res, 'Subscriptions list retrieved.', subscriptions);
        }
        catch (err) {
            next(err);
        }
    }
    static async getAuditLogs(req, res, next) {
        try {
            const supabase = (0, supabaseClient_1.getSupabaseClient)();
            let logs = [];
            if (supabase) {
                const { data } = await supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(100);
                logs = data || [];
            }
            (0, response_1.sendSuccess)(res, 'Audit logs retrieved.', logs);
        }
        catch (err) {
            next(err);
        }
    }
}
exports.AdminController = AdminController;
//# sourceMappingURL=adminController.js.map