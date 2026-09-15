import { Request, Response, NextFunction } from 'express';
import { BookingService } from '../services/bookingService';
import { BookingRepository } from '../repositories/bookingRepository';
import { createBookingSchema, cancelBookingSchema } from '../validators/schemas';
import { sendSuccess } from '../utils/response';

export class BookingController {
  public static async bookRide(req: Request, res: Response, next: NextFunction) {
    try {
      const studentId = req.user!.userId;
      const validated = createBookingSchema.parse(req.body);
      const result = await BookingService.bookRide(studentId, validated.trip_id, validated.pickup_point_id);
      sendSuccess(res, 'Ride booked successfully.', result, 201);
    } catch (err) {
      next(err);
    }
  }

  public static async cancelBooking(req: Request, res: Response, next: NextFunction) {
    try {
      const studentId = req.user!.userId;
      const bookingId = req.params.id;
      const validated = cancelBookingSchema.parse(req.body);
      await BookingService.cancelBooking(bookingId, studentId, validated.reason);
      sendSuccess(res, 'Booking cancelled successfully.', { bookingId, status: 'CANCELLED' });
    } catch (err) {
      next(err);
    }
  }

  public static async getAllBookings(req: Request, res: Response, next: NextFunction) {
    try {
      const date = req.query.date as string;
      const bookings = await BookingRepository.findAll(date);
      sendSuccess(res, 'All bookings retrieved.', bookings);
    } catch (err) {
      next(err);
    }
  }
}
