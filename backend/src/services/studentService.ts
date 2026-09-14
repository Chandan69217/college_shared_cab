import { db } from '../database/db';
import { NotificationProvider } from '../integrations/notificationProvider';
import { StudentProfile } from '../types';

export class StudentService {
  /**
   * Submit or update student verification documents
   */
  public static async submitVerification(
    studentId: string,
    data: {
      student_id_number: string;
      roll_number?: string;
      course: string;
      semester: number;
      id_card_url: string;
    }
  ): Promise<StudentProfile> {
    const profile = db.studentProfiles.get(studentId);
    if (!profile) {
      const err: any = new Error('Student profile not found.');
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

    db.studentProfiles.set(studentId, profile);

    await NotificationProvider.send(
      studentId,
      'Verification Under Review',
      'Your student ID documents have been submitted and are pending administrative verification.',
      'GENERAL'
    );

    return profile;
  }

  /**
   * Get student dashboard overview
   */
  public static async getStudentDashboard(studentId: string) {
    const user = db.users.get(studentId);
    const profile = db.studentProfiles.get(studentId);
    
    // Find active subscription
    let activeSubscription: any = null;
    for (const sub of db.subscriptions.values()) {
      if (sub.student_id === studentId && sub.status === 'ACTIVE') {
        const plan = db.subscriptionPlans.get(sub.plan_id);
        activeSubscription = { ...sub, plan };
        break;
      }
    }

    // Find today's booking
    const today = new Date().toISOString().split('T')[0];
    let todaysBooking: any = null;
    let todaysPass: any = null;

    for (const b of db.bookings.values()) {
      if (b.student_id === studentId && b.booking_date === today && b.status === 'CONFIRMED') {
        const trip = db.trips.get(b.trip_id);
        const route = db.routes.get(b.route_id);
        const pickup = db.pickupPoints.get(b.pickup_point_id);
        todaysBooking = { ...b, trip, route, pickup };
        break;
      }
    }

    if (todaysBooking) {
      for (const p of db.dailyPasses.values()) {
        if (p.booking_id === todaysBooking.id && (p.status === 'ACTIVE' || p.status === 'USED')) {
          todaysPass = p;
          break;
        }
      }
    }

    // Get recent notifications count
    let unreadNotifs = 0;
    for (const n of db.notifications.values()) {
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
  public static async triggerSosAlert(
    studentId: string,
    location?: { latitude: number; longitude: number }
  ) {
    const user = db.users.get(studentId);

    // Notify student confirmation
    await NotificationProvider.send(
      studentId,
      'SOS Alert Dispatched',
      'Emergency SOS signal sent to campus security and emergency contacts.',
      'EMERGENCY'
    );

    // Broadcast emergency notification to admins
    await NotificationProvider.broadcastToRole(
      'ALL',
      'EMERGENCY SOS ALERT',
      `Student ${user?.full_name} (${user?.phone}) triggered an SOS emergency alert.`,
      'EMERGENCY'
    );

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
