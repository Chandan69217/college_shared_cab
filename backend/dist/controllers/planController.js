"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlanController = void 0;
const db_1 = require("../database/db");
const response_1 = require("../utils/response");
class PlanController {
    static async getPlans(req, res, next) {
        try {
            const plans = Array.from(db_1.db.subscriptionPlans.values()).filter((p) => p.status !== 'ARCHIVED');
            (0, response_1.sendSuccess)(res, 'Subscription plans retrieved.', plans);
        }
        catch (err) {
            next(err);
        }
    }
    static async createPlan(req, res, next) {
        try {
            const id = `plan-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
            const now = new Date().toISOString();
            const plan = {
                id,
                college_id: req.body.college_id,
                tier: req.body.tier,
                name: req.body.name,
                description: req.body.description,
                price: req.body.price,
                validity_days: req.body.validity_days,
                ride_count_total: req.body.ride_count_total,
                is_unlimited_rides: req.body.is_unlimited_rides || false,
                priority_booking: req.body.priority_booking || false,
                one_way_allowed: req.body.one_way_allowed ?? true,
                round_trip_allowed: req.body.round_trip_allowed ?? true,
                cancellation_hours_limit: req.body.cancellation_hours_limit ?? 2,
                cancellation_fee_percentage: req.body.cancellation_fee_percentage ?? 10,
                additional_ride_charge: req.body.additional_ride_charge ?? 50,
                status: req.body.status || 'ACTIVE',
                created_at: now,
                updated_at: now,
            };
            db_1.db.subscriptionPlans.set(id, plan);
            (0, response_1.sendSuccess)(res, 'Plan created successfully.', plan, 201);
        }
        catch (err) {
            next(err);
        }
    }
    static async updatePlan(req, res, next) {
        try {
            const planId = req.params.id;
            const plan = db_1.db.subscriptionPlans.get(planId);
            if (!plan) {
                const err = new Error('Plan not found.');
                err.statusCode = 404;
                err.code = 'PLAN_NOT_FOUND';
                throw err;
            }
            Object.assign(plan, req.body, { updated_at: new Date().toISOString() });
            db_1.db.subscriptionPlans.set(planId, plan);
            (0, response_1.sendSuccess)(res, 'Plan updated successfully.', plan);
        }
        catch (err) {
            next(err);
        }
    }
}
exports.PlanController = PlanController;
//# sourceMappingURL=planController.js.map