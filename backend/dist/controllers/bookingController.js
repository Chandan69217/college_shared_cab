"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BookingController = void 0;
const bookingService_1 = require("../services/bookingService");
const bookingRepository_1 = require("../repositories/bookingRepository");
const schemas_1 = require("../validators/schemas");
const response_1 = require("../utils/response");
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
            await bookingService_1.BookingService.cancelBooking(bookingId, studentId, validated.reason);
            (0, response_1.sendSuccess)(res, 'Booking cancelled successfully.', { bookingId, status: 'CANCELLED' });
        }
        catch (err) {
            next(err);
        }
    }
    static async getAllBookings(req, res, next) {
        try {
            const date = req.query.date;
            const bookings = await bookingRepository_1.BookingRepository.findAll(date);
            (0, response_1.sendSuccess)(res, 'All bookings retrieved.', bookings);
        }
        catch (err) {
            next(err);
        }
    }
}
exports.BookingController = BookingController;
//# sourceMappingURL=bookingController.js.map