"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StudentService = void 0;
const db_1 = require("../database/db");
const notificationProvider_1 = require("../integrations/notificationProvider");
class StudentService {
    /**
     * Submit or update student verification documents
     */
    static async submitVerification(studentId, data) {
        const profile = db_1.db.studentProfiles.get(studentId);
        if (!profile) {
            const err = new Error('Student profile not found.');
            err.statusCode = 404;
            err.code = 'PROFILE_NOT_FOUND';
            throw err;
        }
        profile.student_id_number = data.student_id_number;
        profile.roll_number = data.roll_number;
        profile.course = data.course;
        profile.semester = data.semester;
        profile.id_card_url = data.id_card_url;
        profile.verification_status = 'PENDING';
        profile.updated_at = new Date().toISOString();
        db_1.db.studentProfiles.set(studentId, profile);
        await notificationProvider_1.NotificationProvider.send(studentId, 'Verification Under Review', 'Your student ID documents have been submitted and are pending administrative verification.', 'GENERAL');
        return profile;
    }
    /**
     * Get student dashboard overview
     */
    static async getStudentDashboard(studentId) {
        const user = db_1.db.users.get(studentId);
        const profile = db_1.db.studentProfiles.get(studentId);
        // Find active subscription
        let activeSubscription = null;
        for (const sub of db_1.db.subscriptions.values()) {
            if (sub.student_id === studentId && sub.status === 'ACTIVE') {
                const plan = db_1.db.subscriptionPlans.get(sub.plan_id);
                activeSubscription = { ...sub, plan };
                break;
            }
        }
        // Find today's booking
        const today = new Date().toISOString().split('T')[0];
        let todaysBooking = null;
        let todaysPass = null;
        for (const b of db_1.db.bookings.values()) {
            if (b.student_id === studentId && b.booking_date === today && b.status === 'CONFIRMED') {
                const trip = db_1.db.trips.get(b.trip_id);
                const route = db_1.db.routes.get(b.route_id);
                const pickup = db_1.db.pickupPoints.get(b.pickup_point_id);
                todaysBooking = { ...b, trip, route, pickup };
                break;
            }
        }
        if (todaysBooking) {
            for (const p of db_1.db.dailyPasses.values()) {
                if (p.booking_id === todaysBooking.id && (p.status === 'ACTIVE' || p.status === 'USED')) {
                    todaysPass = p;
                    break;
                }
            }
        }
        // Get recent notifications count
        let unreadNotifs = 0;
        for (const n of db_1.db.notifications.values()) {
            if (n.user_id === studentId && !n.is_read) {
                unreadNotifs++;
            }
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
            unreadNotificationsCount: unreadNotifs,
        };
    }
    /**
     * Trigger SOS Emergency alert
     */
    static async triggerSosAlert(studentId, location) {
        const user = db_1.db.users.get(studentId);
        // Notify student confirmation
        await notificationProvider_1.NotificationProvider.send(studentId, 'SOS Alert Dispatched', 'Emergency SOS signal sent to campus security and emergency contacts.', 'EMERGENCY');
        // Broadcast emergency notification to admins
        await notificationProvider_1.NotificationProvider.broadcastToRole('ALL', 'EMERGENCY SOS ALERT', `Student ${user?.full_name} (${user?.phone}) triggered an SOS emergency alert.`, 'EMERGENCY');
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