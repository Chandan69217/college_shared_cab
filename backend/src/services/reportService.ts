import { ReportRepository } from '../repositories/reportRepository';

export class ReportService {
  /**
   * Generates dynamic financial and operational reports directly from Supabase
   */
  public static async getReportsData() {
    return ReportRepository.getReportsData();
  }
}
