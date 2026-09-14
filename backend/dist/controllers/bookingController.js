"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BookingController = void 0;
const bookingService_1 = require("../services/bookingService");
const schemas_1 = require("../validators/schemas");
const response_1 = require("../utils/response");
const db_1 = require("../database/db");
class BookingController {
    static async bookRide(req, res, next) {
        try {
            const studentId = req.user.userId;
            const validated = schemas_1.createBookingSchema.parse(req.body);
            const result = await bookingService_1.BookingService.bookRide(studentId, validated.trip_id, validated.pickup_point_id);
            (0, response_1.sendSuccess)(res, 'Ride booked successfully.', result, 201);
        }
        catch (err) {
            next(err);
        }
    }
    static async cancelBooking(req, res, next) {
        try {
            const studentId = req.user.userId;
            const bookingId = req.params.id;
            const validated = schemas_1.cancelBookingSchema.parse(req.body);
            const result = await bookingService_1.BookingService.cancelBooking(bookingId, studentId, validated.reason);
            (0, response_1.sendSuccess)(res, 'Booking cancelled successfully.', result);
        }
        catch (err) {
            next(err);
        }
    }
    static async getAllBookings(req, res, next) {
        try {
            const bookings = [];
            for (const b of db_1.db.bookings.values()) {
                const student = db_1.db.users.get(b.student_id);
                const trip = db_1.db.trips.get(b.trip_id);
                const route = db_1.db.routes.get(b.route_id);
                const pickup = db_1.db.pickupPoints.get(b.pickup_point_id);
                bookings.push({
                    ...b,
                    student: student ? { id: student.id, name: student.full_name, phone: student.phone } : undefined,
                    trip,
                    route,
                    pickup,
                });
            }
            (0, response_1.sendSuccess)(res, 'All bookings retrieved.', bookings.reverse());
        }
        catch (err) {
            next(err);
        }
    }
}
exports.BookingController = BookingController;
//# sourceMappingURL=bookingController.js.map