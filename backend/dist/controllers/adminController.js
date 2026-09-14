"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminController = void 0;
const adminService_1 = require("../services/adminService");
const db_1 = require("../database/db");
const response_1 = require("../utils/response");
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
            const students = [];
            for (const [id, user] of db_1.db.users.entries()) {
                if (user.role === 'STUDENT') {
                    const profile = db_1.db.studentProfiles.get(id);
                    students.push({
                        ...user,
                        password_hash: undefined,
                        profile,
                    });
                }
            }
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
            const drivers = [];
            for (const [id, user] of db_1.db.users.entries()) {
                if (user.role === 'DRIVER') {
                    const profile = db_1.db.driverProfiles.get(id);
                    drivers.push({
                        ...user,
                        password_hash: undefined,
                        profile,
                    });
                }
            }
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
    static async getAuditLogs(req, res, next) {
        try {
            (0, response_1.sendSuccess)(res, 'Audit logs retrieved.', db_1.db.auditLogs.slice(-100).reverse());
        }
        catch (err) {
            next(err);
        }
    }
}
exports.AdminController = AdminController;
//# sourceMappingURL=adminController.js.map