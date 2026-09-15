import { Request, Response, NextFunction } from 'express';
import { StudentService } from '../services/studentService';
import { sendSuccess } from '../utils/response';
import { BookingRepository } from '../repositories/bookingRepository';
import { PaymentRepository } from '../repositories/paymentRepository';
import { SubscriptionRepository } from '../repositories/subscriptionRepository';
import { getSupabaseClient } from '../database/supabaseClient';

export class StudentController {
  public static async getDashboard(req: Request, res: Response, next: NextFunction) {
    try {
      const studentId = req.user!.userId;
      const data = await StudentService.getStudentDashboard(studentId);
      sendSuccess(res, 'Dashboard data retrieved.', data);
    } catch (err) {
      next(err);
    }
  }

  public static async submitVerification(req: Request, res: Response, next: NextFunction) {
    try {
      const studentId = req.user!.userId;
      const data = await StudentService.submitVerification(studentId, req.body);
      sendSuccess(res, 'Verification documents submitted.', data);
    } catch (err) {
      next(err);
    }
  }

  public static async getSubscriptions(req: Request, res: Response, next: NextFunction) {
    try {
      const studentId = req.user!.userId;
      const supabase = getSupabaseClient()!;
      const { data: subs, error } = await supabase
        .from('subscriptions')
        .select('*, plan:subscription_plans(*)')
        .eq('student_id', studentId)
        .order('created_at', { ascending: false });

      if (error) throw new Error(error.message);
      sendSuccess(res, 'Subscriptions retrieved.', subs || []);
    } catch (err) {
      next(err);
    }
  }

  public static async getBookings(req: Request, res: Response, next: NextFunction) {
    try {
      const studentId = req.user!.userId;
      const bookings = await BookingRepository.findByStudentId(studentId);
      sendSuccess(res, 'Bookings retrieved.', bookings);
    } catch (err) {
      next(err);
    }
  }

  public static async getPasses(req: Request, res: Response, next: NextFunction) {
    try {
      const studentId = req.user!.userId;
      const supabase = getSupabaseClient()!;
      const { data: passes, error } = await supabase
        .from('daily_travel_passes')
        .select('*, trip:trips(*), route:routes(*), pickup_point:pickup_points(*)')
        .eq('student_id', studentId)
        .order('created_at', { ascending: false });

      if (error) throw new Error(error.message);
      sendSuccess(res, 'Daily passes retrieved.', passes || []);
    } catch (err) {
      next(err);
    }
  }

  public static async getPayments(req: Request, res: Response, next: NextFunction) {
    try {
      const studentId = req.user!.userId;
      const payments = await PaymentRepository.findByStudentId(studentId);
      sendSuccess(res, 'Payment history retrieved.', payments);
    } catch (err) {
      next(err);
    }
  }

  public static async triggerSos(req: Request, res: Response, next: NextFunction) {
    try {
      const studentId = req.user!.userId;
      const result = await StudentService.triggerSosAlert(studentId, req.body.location);
      sendSuccess(res, 'SOS Alert transmitted to Campus Security.', result);
    } catch (err) {
      next(err);
    }
  }
}
