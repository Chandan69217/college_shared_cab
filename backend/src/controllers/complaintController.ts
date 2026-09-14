import { Request, Response, NextFunction } from 'express';
import { ComplaintService } from '../services/complaintService';
import { createComplaintSchema, replyComplaintSchema, rateTripSchema } from '../validators/schemas';
import { sendSuccess } from '../utils/response';
import { db } from '../database/db';
import { Rating } from '../types';

export class ComplaintController {
  public static async createComplaint(req: Request, res: Response, next: NextFunction) {
    try {
      const studentId = req.user!.userId;
      const validated = createComplaintSchema.parse(req.body);
      const result = await ComplaintService.createComplaint(studentId, validated);
      sendSuccess(res, 'Support ticket submitted.', result, 201);
    } catch (err) {
      next(err);
    }
  }

  public static async replyComplaint(req: Request, res: Response, next: NextFunction) {
    try {
      const adminId = req.user!.userId;
      const complaintId = req.params.id;
      const validated = replyComplaintSchema.parse(req.body);
      const result = await ComplaintService.replyComplaint(
        complaintId,
        adminId,
        validated.admin_response,
        validated.status
      );
      sendSuccess(res, 'Complaint resolved/replied.', result);
    } catch (err) {
      next(err);
    }
  }

  public static async getStudentComplaints(req: Request, res: Response, next: NextFunction) {
    try {
      const studentId = req.user!.userId;
      const list = Array.from(db.complaints.values())
        .filter((c) => c.student_id === studentId)
        .reverse();
      sendSuccess(res, 'Complaints retrieved.', list);
    } catch (err) {
      next(err);
    }
  }

  public static async getAllComplaints(req: Request, res: Response, next: NextFunction) {
    try {
      const list = Array.from(db.complaints.values()).reverse();
      sendSuccess(res, 'All complaints retrieved.', list);
    } catch (err) {
      next(err);
    }
  }

  public static async rateTrip(req: Request, res: Response, next: NextFunction) {
    try {
      const studentId = req.user!.userId;
      const validated = rateTripSchema.parse(req.body);

      const trip = db.trips.get(validated.trip_id);
      if (!trip) {
        const err: any = new Error('Trip not found.');
        err.statusCode = 404;
        err.code = 'TRIP_NOT_FOUND';
        throw err;
      }

      const ratingId = `rat-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const rating: Rating = {
        id: ratingId,
        trip_id: validated.trip_id,
        student_id: studentId,
        driver_id: trip.driver_id,
        rating_stars: validated.rating_stars,
        feedback_text: validated.feedback_text,
        tags: validated.tags,
        created_at: new Date().toISOString(),
      };

      db.ratings.set(ratingId, rating);
      sendSuccess(res, 'Thank you for your rating!', rating, 201);
    } catch (err) {
      next(err);
    }
  }
}
