"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StudentController = void 0;
const studentService_1 = require("../services/studentService");
const trackingService_1 = require("../services/trackingService");
const response_1 = require("../utils/response");
const bookingRepository_1 = require("../repositories/bookingRepository");
const paymentRepository_1 = require("../repositories/paymentRepository");
const supabaseClient_1 = require("../database/supabaseClient");
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
    static async getLiveTracking(req, res, next) {
        try {
            const studentId = req.user.userId;
            const tracking = await trackingService_1.TrackingService.getStudentLiveTracking(studentId);
            (0, response_1.sendSuccess)(res, 'Student live tracking data retrieved.', tracking);
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
            const supabase = (0, supabaseClient_1.getSupabaseClient)();
            const { data: subs, error } = await supabase
                .from('subscriptions')
                .select('*, plan:subscription_plans(*)')
                .eq('student_id', studentId)
                .order('created_at', { ascending: false });
            if (error)
                throw new Error(error.message);
            (0, response_1.sendSuccess)(res, 'Subscriptions retrieved.', subs || []);
        }
        catch (err) {
            next(err);
        }
    }
    static async getBookings(req, res, next) {
        try {
            const studentId = req.user.userId;
            const bookings = await bookingRepository_1.BookingRepository.findByStudentId(studentId);
            (0, response_1.sendSuccess)(res, 'Bookings retrieved.', bookings);
        }
        catch (err) {
            next(err);
        }
    }
    static async getPasses(req, res, next) {
        try {
            const studentId = req.user.userId;
            const supabase = (0, supabaseClient_1.getSupabaseClient)();
            const { data: passes, error } = await supabase
                .from('daily_travel_passes')
                .select('*, trip:trips(*, route:routes(*), vehicle:vehicles(*), driver:users!trips_driver_id_fkey(*)), route:routes(*), pickup_point:pickup_points!daily_travel_passes_pickup_point_id_fkey(*), drop_point:pickup_points!daily_travel_passes_drop_point_id_fkey(*)')
                .eq('student_id', studentId)
                .order('created_at', { ascending: false });
            if (error)
                throw new Error(error.message);
            (0, response_1.sendSuccess)(res, 'Daily passes retrieved.', passes || []);
        }
        catch (err) {
            next(err);
        }
    }
    static async getTodayPass(req, res, next) {
        try {
            const studentId = req.user.userId;
            const today = new Date().toISOString().split('T')[0];
            const todaysBooking = await bookingRepository_1.BookingRepository.findTodayBooking(studentId, today);
            let todaysPass = null;
            if (todaysBooking) {
                todaysPass = await bookingRepository_1.BookingRepository.findDailyPass(todaysBooking.id);
            }
            if (!todaysPass) {
                todaysPass = await bookingRepository_1.BookingRepository.findActivePassByStudent(studentId);
            }
            (0, response_1.sendSuccess)(res, "Today's pass retrieved.", todaysPass);
        }
        catch (err) {
            next(err);
        }
    }
    static async getPayments(req, res, next) {
        try {
            const studentId = req.user.userId;
            const payments = await paymentRepository_1.PaymentRepository.findByStudentId(studentId);
            (0, response_1.sendSuccess)(res, 'Payment history retrieved.', payments);
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