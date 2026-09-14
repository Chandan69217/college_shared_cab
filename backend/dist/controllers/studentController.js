"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StudentController = void 0;
const studentService_1 = require("../services/studentService");
const db_1 = require("../database/db");
const response_1 = require("../utils/response");
class StudentController {
    static async getDashboard(req, res, next) {
        try {
            const studentId = req.user.userId;
            const data = await studentService_1.StudentService.getStudentDashboard(studentId);
            (0, response_1.sendSuccess)(res, 'Dashboard data retrieved.', data);
        }
        catch (err) {
            next(err);
        }
    }
    static async submitVerification(req, res, next) {
        try {
            const studentId = req.user.userId;
            const data = await studentService_1.StudentService.submitVerification(studentId, req.body);
            (0, response_1.sendSuccess)(res, 'Verification documents submitted.', data);
        }
        catch (err) {
            next(err);
        }
    }
    static async getSubscriptions(req, res, next) {
        try {
            const studentId = req.user.userId;
            const subscriptions = [];
            for (const s of db_1.db.subscriptions.values()) {
                if (s.student_id === studentId) {
                    const plan = db_1.db.subscriptionPlans.get(s.plan_id);
                    subscriptions.push({ ...s, plan });
                }
            }
            (0, response_1.sendSuccess)(res, 'Subscriptions retrieved.', subscriptions);
        }
        catch (err) {
            next(err);
        }
    }
    static async getBookings(req, res, next) {
        try {
            const studentId = req.user.userId;
            const bookings = [];
            for (const b of db_1.db.bookings.values()) {
                if (b.student_id === studentId) {
                    const trip = db_1.db.trips.get(b.trip_id);
                    const route = db_1.db.routes.get(b.route_id);
                    const pickup = db_1.db.pickupPoints.get(b.pickup_point_id);
                    bookings.push({ ...b, trip, route, pickup });
                }
            }
            (0, response_1.sendSuccess)(res, 'Bookings retrieved.', bookings.reverse());
        }
        catch (err) {
            next(err);
        }
    }
    static async getPasses(req, res, next) {
        try {
            const studentId = req.user.userId;
            const passes = [];
            for (const p of db_1.db.dailyPasses.values()) {
                if (p.student_id === studentId) {
                    const route = db_1.db.routes.get(p.route_id);
                    const pickup = db_1.db.pickupPoints.get(p.pickup_point_id);
                    passes.push({ ...p, route, pickup });
                }
            }
            (0, response_1.sendSuccess)(res, 'Daily passes retrieved.', passes.reverse());
        }
        catch (err) {
            next(err);
        }
    }
    static async getPayments(req, res, next) {
        try {
            const studentId = req.user.userId;
            const payments = [];
            for (const pay of db_1.db.payments.values()) {
                if (pay.student_id === studentId) {
                    payments.push(pay);
                }
            }
            (0, response_1.sendSuccess)(res, 'Payment history retrieved.', payments.reverse());
        }
        catch (err) {
            next(err);
        }
    }
    static async triggerSos(req, res, next) {
        try {
            const studentId = req.user.userId;
            const result = await studentService_1.StudentService.triggerSosAlert(studentId, req.body.location);
            (0, response_1.sendSuccess)(res, 'SOS Alert transmitted to Campus Security.', result);
        }
        catch (err) {
            next(err);
        }
    }
}
exports.StudentController = StudentController;
//# sourceMappingURL=studentController.js.map