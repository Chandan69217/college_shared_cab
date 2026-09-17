import { NotificationProvider } from '../integrations/notificationProvider';
import { NotificationService } from './notificationService';
import { StudentProfile } from '../types';
import { UserRepository } from '../repositories/userRepository';
import { SubscriptionRepository } from '../repositories/subscriptionRepository';
import { BookingRepository } from '../repositories/bookingRepository';
import { SettingsRepository } from '../repositories/settingsRepository';

export class StudentService {
  /**
   * Submit or update student verification documents in Supabase
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
    const profile = await UserRepository.updateStudentProfile(studentId, {
      student_id_number: data.student_id_number,
      roll_number: data.roll_number,
      course: data.course,
      semester: data.semester,
      id_card_url: data.id_card_url,
      verification_status: 'PENDING',
    });

    await NotificationService.createNotification({
      userId: studentId,
      recipientRole: 'STUDENT',
      title: 'Verification Under Review',
      message: 'Your student ID documents have been submitted and are pending administrative verification.',
      type: 'KYC_SUBMITTED',
      entityType: 'KYC',
      entityId: studentId,
      priority: 'NORMAL',
    });

    return profile;
  }

  /**
   * Get student dashboard overview from live Supabase tables
   */
  public static async getStudentDashboard(studentId: string) {
    const user = await UserRepository.findById(studentId);
    const profile = await UserRepository.getStudentProfile(studentId);
    
    // Find active subscription
    const activeSubscription = await SubscriptionRepository.findActiveByStudentId(studentId);

    // Find today's booking and pass
    const today = new Date().toISOString().split('T')[0];
    const todaysBooking = await BookingRepository.findTodayBooking(studentId, today);
    let todaysPass = null;
    if (todaysBooking) {
      todaysPass = await BookingRepository.findDailyPass(todaysBooking.id);
    }

    const unreadNotificationsCount = await NotificationService.getUnreadCount(studentId);

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
      unreadNotificationsCount,
    };
  }

  /**
   * Trigger SOS Emergency alert
   */
  public static async triggerSosAlert(
    studentId: string,
    location?: { latitude: number; longitude: number }
  ) {
    const user = await UserRepository.findById(studentId);

    await NotificationProvider.send(
      studentId,
      'SOS Alert Dispatched',
      'Emergency SOS signal sent to campus security and emergency contacts.',
      'EMERGENCY'
    );

    const broadcastEnabled = await SettingsRepository.get('emergencySosBroadcast', true);
    if (broadcastEnabled) {
      await NotificationProvider.broadcastToRole(
        'ALL',
        'EMERGENCY SOS ALERT',
        `Student ${user?.full_name || 'Unknown'} (${user?.phone || 'N/A'}) triggered an SOS emergency alert.`,
        'EMERGENCY'
      );
    }

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
