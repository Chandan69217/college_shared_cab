import { Request, Response, NextFunction } from 'express';
import { db } from '../database/db';
import { sendSuccess } from '../utils/response';
import { SubscriptionPlan } from '../types';

export class PlanController {
  public static async getPlans(req: Request, res: Response, next: NextFunction) {
    try {
      const plans = Array.from(db.subscriptionPlans.values()).filter((p) => p.status !== 'ARCHIVED');
      sendSuccess(res, 'Subscription plans retrieved.', plans);
    } catch (err) {
      next(err);
    }
  }

  public static async createPlan(req: Request, res: Response, next: NextFunction) {
    try {
      const id = `plan-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const now = new Date().toISOString();
      const plan: SubscriptionPlan = {
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

      db.subscriptionPlans.set(id, plan);
      sendSuccess(res, 'Plan created successfully.', plan, 201);
    } catch (err) {
      next(err);
    }
  }

  public static async updatePlan(req: Request, res: Response, next: NextFunction) {
    try {
      const planId = req.params.id;
      const plan = db.subscriptionPlans.get(planId);
      if (!plan) {
        const err: any = new Error('Plan not found.');
        err.statusCode = 404;
        err.code = 'PLAN_NOT_FOUND';
        throw err;
      }

      Object.assign(plan, req.body, { updated_at: new Date().toISOString() });
      db.subscriptionPlans.set(planId, plan);

      sendSuccess(res, 'Plan updated successfully.', plan);
    } catch (err) {
      next(err);
    }
  }
}
