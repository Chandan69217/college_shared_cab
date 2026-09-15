import { Request, Response, NextFunction } from 'express';
import { ComplaintService } from '../services/complaintService';
import { ComplaintRepository } from '../repositories/complaintRepository';
import { TripRepository } from '../repositories/tripRepository';
import { createComplaintSchema, replyComplaintSchema, rateTripSchema } from '../validators/schemas';
import { sendSuccess } from '../utils/response';
import { getSupabaseClient } from '../database/supabaseClient';

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
      const list = await ComplaintRepository.findByStudentId(studentId);
      sendSuccess(res, 'Complaints retrieved.', list);
    } catch (err) {
      next(err);
    }
  }

  public static async getAllComplaints(req: Request, res: Response, next: NextFunction) {
    try {
      const list = await ComplaintRepository.findAll();
      sendSuccess(res, 'All complaints retrieved.', list);
    } catch (err) {
      next(err);
    }
  }

  public static async rateTrip(req: Request, res: Response, next: NextFunction) {
    try {
      const studentId = req.user!.userId;
      const validated = rateTripSchema.parse(req.body);

      const trip = await TripRepository.findById(validated.trip_id);
      if (!trip) {
        const err: any = new Error('Trip not found.');
        err.statusCode = 404;
        err.code = 'TRIP_NOT_FOUND';
        throw err;
      }

      const supabase = getSupabaseClient()!;
      const { data: rating, error } = await supabase
        .from('driver_ratings')
        .insert([{
          trip_id: validated.trip_id,
          student_id: studentId,
          driver_id: trip.driver_id,
          rating: validated.rating_stars,
          comment: validated.feedback_text,
        }])
        .select('*')
        .single();

      if (error) throw new Error(error.message);
      sendSuccess(res, 'Thank you for your rating!', rating, 201);
    } catch (err) {
      next(err);
    }
  }
}
