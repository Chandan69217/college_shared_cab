import { Request, Response, NextFunction } from 'express';
import { PlanRepository } from '../repositories/subscriptionRepository';
import { sendSuccess } from '../utils/response';

export class PlanController {
  public static async getPlans(req: Request, res: Response, next: NextFunction) {
    try {
      const collegeId = req.query.college_id as string;
      const plans = await PlanRepository.findAll(collegeId);
      sendSuccess(res, 'Subscription plans retrieved.', plans);
    } catch (err) {
      next(err);
    }
  }

  public static async createPlan(req: Request, res: Response, next: NextFunction) {
    try {
      const plan = await PlanRepository.create({
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
      });

      sendSuccess(res, 'Plan created successfully.', plan, 201);
    } catch (err) {
      next(err);
    }
  }

  public static async updatePlan(req: Request, res: Response, next: NextFunction) {
    try {
      const planId = req.params.id;
      const plan = await PlanRepository.update(planId, req.body);
      sendSuccess(res, 'Plan updated successfully.', plan);
    } catch (err) {
      next(err);
    }
  }
}
