"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StudentService = void 0;
const notificationProvider_1 = require("../integrations/notificationProvider");
const userRepository_1 = require("../repositories/userRepository");
const subscriptionRepository_1 = require("../repositories/subscriptionRepository");
const bookingRepository_1 = require("../repositories/bookingRepository");
class StudentService {
    /**
     * Submit or update student verification documents in Supabase
     */
    static async submitVerification(studentId, data) {
        const profile = await userRepository_1.UserRepository.updateStudentProfile(studentId, {
            student_id_number: data.student_id_number,
            roll_number: data.roll_number,
            course: data.course,
            semester: data.semester,
            id_card_url: data.id_card_url,
            verification_status: 'PENDING',
        });
        await notificationProvider_1.NotificationProvider.send(studentId, 'Verification Under Review', 'Your student ID documents have been submitted and are pending administrative verification.', 'GENERAL');
        return profile;
    }
    /**
     * Get student dashboard overview from live Supabase tables
     */
    static async getStudentDashboard(studentId) {
        const user = await userRepository_1.UserRepository.findById(studentId);
        const profile = await userRepository_1.UserRepository.getStudentProfile(studentId);
        // Find active subscription
        const activeSubscription = await subscriptionRepository_1.SubscriptionRepository.findActiveByStudentId(studentId);
        // Find today's booking and pass
        const today = new Date().toISOString().split('T')[0];
        const todaysBooking = await bookingRepository_1.BookingRepository.findTodayBooking(studentId, today);
        let todaysPass = null;
        if (todaysBooking) {
            todaysPass = await bookingRepository_1.BookingRepository.findDailyPass(todaysBooking.id);
        }
        return {
            user: {
                id: user?.id,
                full_name: user?.full_name,
                email: user?.email,
                phone: user?.phone,
                role: user?.role,
            },
            profile,
            activeSubscription,
            todaysBooking,
            todaysPass,
            unreadNotificationsCount: 0,
        };
    }
    /**
     * Trigger SOS Emergency alert
     */
    static async triggerSosAlert(studentId, location) {
        const user = await userRepository_1.UserRepository.findById(studentId);
        await notificationProvider_1.NotificationProvider.send(studentId, 'SOS Alert Dispatched', 'Emergency SOS signal sent to campus security and emergency contacts.', 'EMERGENCY');
        await notificationProvider_1.NotificationProvider.broadcastToRole('ALL', 'EMERGENCY SOS ALERT', `Student ${user?.full_name || 'Unknown'} (${user?.phone || 'N/A'}) triggered an SOS emergency alert.`, 'EMERGENCY');
        return {
            success: true,
            timestamp: new Date().toISOString(),
            studentName: user?.full_name,
            studentPhone: user?.phone,
            location,
            contactsNotified: 2,
        };
    }
}
exports.StudentService = StudentService;
//# sourceMappingURL=studentService.js.map