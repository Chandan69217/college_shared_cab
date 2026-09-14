import { Request, Response, NextFunction } from 'express';
import { ReportService } from '../services/reportService';
import { sendSuccess } from '../utils/response';

export class ReportController {
  public static async getReports(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await ReportService.getReportsData();
      sendSuccess(res, 'Analytics and reporting data retrieved.', data);
    } catch (err) {
      next(err);
    }
  }
}
