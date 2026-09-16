"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlanController = void 0;
const subscriptionRepository_1 = require("../repositories/subscriptionRepository");
const supabaseClient_1 = require("../database/supabaseClient");
const schemas_1 = require("../validators/schemas");
const response_1 = require("../utils/response");
class PlanController {
    static async getPlans(req, res, next) {
        try {
            const collegeId = req.query.college_id;
            const plans = await subscriptionRepository_1.PlanRepository.findAll(collegeId);
            (0, response_1.sendSuccess)(res, 'Subscription plans retrieved.', plans);
        }
        catch (err) {
            next(err);
        }
    }
    static async createPlan(req, res, next) {
        try {
            const validated = schemas_1.createPlanSchema.parse(req.body);
            let collegeId = validated.college_id;
            if (!collegeId) {
                const { data: colleges } = await (0, supabaseClient_1.getSupabaseClient)()
                    .from('colleges')
                    .select('id')
                    .limit(1);
                if (colleges && colleges.length > 0) {
                    collegeId = colleges[0].id;
                }
            }
            if (!collegeId) {
                const err = new Error('A valid college_id is required to create a subscription plan.');
                err.statusCode = 400;
                err.code = 'COLLEGE_REQUIRED';
                throw err;
            }
            const plan = await subscriptionRepository_1.PlanRepository.create({
                college_id: collegeId,
                tier: validated.tier,
                name: validated.name,
                description: validated.description || '',
                price: validated.price,
                validity_days: validated.validity_days,
                ride_count_total: validated.ride_count_total,
                is_unlimited_rides: validated.is_unlimited_rides,
                priority_booking: validated.priority_booking,
                one_way_allowed: validated.one_way_allowed,
                round_trip_allowed: validated.round_trip_allowed,
                cancellation_hours_limit: validated.cancellation_hours_limit,
                cancellation_fee_percentage: validated.cancellation_fee_percentage,
                additional_ride_charge: validated.additional_ride_charge,
                status: validated.status,
            });
            (0, response_1.sendSuccess)(res, 'Plan created successfully.', plan, 201);
        }
        catch (err) {
            next(err);
        }
    }
    static async updatePlan(req, res, next) {
        try {
            const planId = req.params.id;
            const validated = schemas_1.updatePlanSchema.parse(req.body);
            const plan = await subscriptionRepository_1.PlanRepository.update(planId, validated);
            (0, response_1.sendSuccess)(res, 'Plan updated successfully.', plan);
        }
        catch (err) {
            next(err);
        }
    }
    static async deletePlan(req, res, next) {
        try {
            const planId = req.params.id;
            await subscriptionRepository_1.PlanRepository.delete(planId);
            (0, response_1.sendSuccess)(res, 'Plan deleted successfully.');
        }
        catch (err) {
            next(err);
        }
    }
}
exports.PlanController = PlanController;
//# sourceMappingURL=planController.js.map