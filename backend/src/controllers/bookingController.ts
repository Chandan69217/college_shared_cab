import { Request, Response, NextFunction } from 'express';
import { BookingService } from '../services/bookingService';
import { createBookingSchema, cancelBookingSchema } from '../validators/schemas';
import { sendSuccess } from '../utils/response';
import { db } from '../database/db';

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
      const result = await BookingService.cancelBooking(bookingId, studentId, validated.reason);
      sendSuccess(res, 'Booking cancelled successfully.', result);
    } catch (err) {
      next(err);
    }
  }

  public static async getAllBookings(req: Request, res: Response, next: NextFunction) {
    try {
      const bookings: any[] = [];
      for (const b of db.bookings.values()) {
        const student = db.users.get(b.student_id);
        const trip = db.trips.get(b.trip_id);
        const route = db.routes.get(b.route_id);
        const pickup = db.pickupPoints.get(b.pickup_point_id);
        bookings.push({
          ...b,
          student: student ? { id: student.id, name: student.full_name, phone: student.phone } : undefined,
          trip,
          route,
          pickup,
        });
      }
      sendSuccess(res, 'All bookings retrieved.', bookings.reverse());
    } catch (err) {
      next(err);
    }
  }
}
