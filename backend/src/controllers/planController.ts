import { Request, Response, NextFunction } from 'express';
import { PlanRepository } from '../repositories/subscriptionRepository';
import { getSupabaseClient } from '../database/supabaseClient';
import { createPlanSchema, updatePlanSchema } from '../validators/schemas';
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
      const validated = createPlanSchema.parse(req.body);

      let collegeId = validated.college_id;
      if (!collegeId) {
        const { data: colleges } = await getSupabaseClient()!
          .from('colleges')
          .select('id')
          .limit(1);
        if (colleges && colleges.length > 0) {
          collegeId = colleges[0].id;
        }
      }

      if (!collegeId) {
        const err: any = new Error('A valid college_id is required to create a subscription plan.');
        err.statusCode = 400;
        err.code = 'COLLEGE_REQUIRED';
        throw err;
      }

      const plan = await PlanRepository.create({
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

      sendSuccess(res, 'Plan created successfully.', plan, 201);
    } catch (err) {
      next(err);
    }
  }

  public static async updatePlan(req: Request, res: Response, next: NextFunction) {
    try {
      const planId = req.params.id;
      const validated = updatePlanSchema.parse(req.body);
      const plan = await PlanRepository.update(planId, validated);
      sendSuccess(res, 'Plan updated successfully.', plan);
    } catch (err) {
      next(err);
    }
  }

  public static async deletePlan(req: Request, res: Response, next: NextFunction) {
    try {
      const planId = req.params.id;
      await PlanRepository.delete(planId);
      sendSuccess(res, 'Plan deleted successfully.');
    } catch (err) {
      next(err);
    }
  }
}

