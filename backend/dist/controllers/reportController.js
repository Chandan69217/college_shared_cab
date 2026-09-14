"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportController = void 0;
const reportService_1 = require("../services/reportService");
const response_1 = require("../utils/response");
class ReportController {
    static async getReports(req, res, next) {
        try {
            const data = await reportService_1.ReportService.getReportsData();
            (0, response_1.sendSuccess)(res, 'Analytics and reporting data retrieved.', data);
        }
        catch (err) {
            next(err);
        }
    }
}
exports.ReportController = ReportController;
//# sourceMappingURL=reportController.js.map