import { Request, Response, NextFunction } from 'express';
import { HolidayRepository } from '../repositories/holidayRepository';
import { HolidayService } from '../services/holidayService';
import { createHolidaySchema } from '../validators/schemas';
import { sendSuccess } from '../utils/response';

export class HolidayController {
  public static async getHolidays(req: Request, res: Response, next: NextFunction) {
    try {
      const collegeId = req.query.college_id as string;
      const holidays = await HolidayRepository.findAll(collegeId);
      sendSuccess(res, 'College holidays retrieved.', holidays);
    } catch (err) {
      next(err);
    }
  }

  public static async createHoliday(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = createHolidaySchema.parse(req.body);
      const holiday = await HolidayService.addHoliday(validated);
      sendSuccess(res, 'Holiday added to calendar.', holiday, 201);
    } catch (err) {
      next(err);
    }
  }
}
