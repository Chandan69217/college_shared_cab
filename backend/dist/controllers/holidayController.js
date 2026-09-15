"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HolidayController = void 0;
const holidayRepository_1 = require("../repositories/holidayRepository");
const holidayService_1 = require("../services/holidayService");
const schemas_1 = require("../validators/schemas");
const response_1 = require("../utils/response");
class HolidayController {
    static async getHolidays(req, res, next) {
        try {
            const collegeId = req.query.college_id;
            const holidays = await holidayRepository_1.HolidayRepository.findAll(collegeId);
            (0, response_1.sendSuccess)(res, 'College holidays retrieved.', holidays);
        }
        catch (err) {
            next(err);
        }
    }
    static async createHoliday(req, res, next) {
        try {
            const validated = schemas_1.createHolidaySchema.parse(req.body);
            const holiday = await holidayService_1.HolidayService.addHoliday(validated);
            (0, response_1.sendSuccess)(res, 'Holiday added to calendar.', holiday, 201);
        }
        catch (err) {
            next(err);
        }
    }
}
exports.HolidayController = HolidayController;
//# sourceMappingURL=holidayController.js.map