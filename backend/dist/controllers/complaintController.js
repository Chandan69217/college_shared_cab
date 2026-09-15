"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ComplaintController = void 0;
const complaintService_1 = require("../services/complaintService");
const complaintRepository_1 = require("../repositories/complaintRepository");
const tripRepository_1 = require("../repositories/tripRepository");
const schemas_1 = require("../validators/schemas");
const response_1 = require("../utils/response");
const supabaseClient_1 = require("../database/supabaseClient");
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
            const list = await complaintRepository_1.ComplaintRepository.findByStudentId(studentId);
            (0, response_1.sendSuccess)(res, 'Complaints retrieved.', list);
        }
        catch (err) {
            next(err);
        }
    }
    static async getAllComplaints(req, res, next) {
        try {
            const list = await complaintRepository_1.ComplaintRepository.findAll();
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
            const trip = await tripRepository_1.TripRepository.findById(validated.trip_id);
            if (!trip) {
                const err = new Error('Trip not found.');
                err.statusCode = 404;
                err.code = 'TRIP_NOT_FOUND';
                throw err;
            }
            const supabase = (0, supabaseClient_1.getSupabaseClient)();
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
            if (error)
                throw new Error(error.message);
            (0, response_1.sendSuccess)(res, 'Thank you for your rating!', rating, 201);
        }
        catch (err) {
            next(err);
        }
    }
}
exports.ComplaintController = ComplaintController;
//# sourceMappingURL=complaintController.js.map