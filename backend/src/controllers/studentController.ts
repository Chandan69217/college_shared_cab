import { Request, Response, NextFunction } from 'express';
import { StudentService } from '../services/studentService';
import { db } from '../database/db';
import { sendSuccess, sendError } from '../utils/response';

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
      const subscriptions: any[] = [];
      for (const s of db.subscriptions.values()) {
        if (s.student_id === studentId) {
          const plan = db.subscriptionPlans.get(s.plan_id);
          subscriptions.push({ ...s, plan });
        }
      }
      sendSuccess(res, 'Subscriptions retrieved.', subscriptions);
    } catch (err) {
      next(err);
    }
  }

  public static async getBookings(req: Request, res: Response, next: NextFunction) {
    try {
      const studentId = req.user!.userId;
      const bookings: any[] = [];
      for (const b of db.bookings.values()) {
        if (b.student_id === studentId) {
          const trip = db.trips.get(b.trip_id);
          const route = db.routes.get(b.route_id);
          const pickup = db.pickupPoints.get(b.pickup_point_id);
          bookings.push({ ...b, trip, route, pickup });
        }
      }
      sendSuccess(res, 'Bookings retrieved.', bookings.reverse());
    } catch (err) {
      next(err);
    }
  }

  public static async getPasses(req: Request, res: Response, next: NextFunction) {
    try {
      const studentId = req.user!.userId;
      const passes: any[] = [];
      for (const p of db.dailyPasses.values()) {
        if (p.student_id === studentId) {
          const route = db.routes.get(p.route_id);
          const pickup = db.pickupPoints.get(p.pickup_point_id);
          passes.push({ ...p, route, pickup });
        }
      }
      sendSuccess(res, 'Daily passes retrieved.', passes.reverse());
    } catch (err) {
      next(err);
    }
  }

  public static async getPayments(req: Request, res: Response, next: NextFunction) {
    try {
      const studentId = req.user!.userId;
      const payments: any[] = [];
      for (const pay of db.payments.values()) {
        if (pay.student_id === studentId) {
          payments.push(pay);
        }
      }
      sendSuccess(res, 'Payment history retrieved.', payments.reverse());
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
