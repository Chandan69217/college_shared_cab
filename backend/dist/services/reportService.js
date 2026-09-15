"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportService = void 0;
const reportRepository_1 = require("../repositories/reportRepository");
class ReportService {
    /**
     * Generates dynamic financial and operational reports directly from Supabase
     */
    static async getReportsData() {
        return reportRepository_1.ReportRepository.getReportsData();
    }
}
exports.ReportService = ReportService;
//# sourceMappingURL=reportService.js.map