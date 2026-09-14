"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ComplaintController = void 0;
const complaintService_1 = require("../services/complaintService");
const schemas_1 = require("../validators/schemas");
const response_1 = require("../utils/response");
const db_1 = require("../database/db");
class ComplaintController {
    static async createComplaint(req, res, next) {
        try {
            const studentId = req.user.userId;
            const validated = schemas_1.createComplaintSchema.parse(req.body);
            const result = await complaintService_1.ComplaintService.createComplaint(studentId, validated);
            (0, response_1.sendSuccess)(res, 'Support ticket submitted.', result, 201);
        }
        catch (err) {
            next(err);
        }
    }
    static async replyComplaint(req, res, next) {
        try {
            const adminId = req.user.userId;
            const complaintId = req.params.id;
            const validated = schemas_1.replyComplaintSchema.parse(req.body);
            const result = await complaintService_1.ComplaintService.replyComplaint(complaintId, adminId, validated.admin_response, validated.status);
            (0, response_1.sendSuccess)(res, 'Complaint resolved/replied.', result);
        }
        catch (err) {
            next(err);
        }
    }
    static async getStudentComplaints(req, res, next) {
        try {
            const studentId = req.user.userId;
            const list = Array.from(db_1.db.complaints.values())
                .filter((c) => c.student_id === studentId)
                .reverse();
            (0, response_1.sendSuccess)(res, 'Complaints retrieved.', list);
        }
        catch (err) {
            next(err);
        }
    }
    static async getAllComplaints(req, res, next) {
        try {
            const list = Array.from(db_1.db.complaints.values()).reverse();
            (0, response_1.sendSuccess)(res, 'All complaints retrieved.', list);
        }
        catch (err) {
            next(err);
        }
    }
    static async rateTrip(req, res, next) {
        try {
            const studentId = req.user.userId;
            const validated = schemas_1.rateTripSchema.parse(req.body);
            const trip = db_1.db.trips.get(validated.trip_id);
            if (!trip) {
                const err = new Error('Trip not found.');
                err.statusCode = 404;
                err.code = 'TRIP_NOT_FOUND';
                throw err;
            }
            const ratingId = `rat-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
            const rating = {
                id: ratingId,
                trip_id: validated.trip_id,
                student_id: studentId,
                driver_id: trip.driver_id,
                rating_stars: validated.rating_stars,
                feedback_text: validated.feedback_text,
                tags: validated.tags,
                created_at: new Date().toISOString(),
            };
            db_1.db.ratings.set(ratingId, rating);
            (0, response_1.sendSuccess)(res, 'Thank you for your rating!', rating, 201);
        }
        catch (err) {
            next(err);
        }
    }
}
exports.ComplaintController = ComplaintController;
//# sourceMappingURL=complaintController.js.map