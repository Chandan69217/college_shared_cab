"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HolidayService = void 0;
const holidayRepository_1 = require("../repositories/holidayRepository");
class HolidayService {
    /**
     * Check if a given date is a non-service holiday in Supabase
     */
    static async isHoliday(collegeId, dateStr) {
        const holidays = await holidayRepository_1.HolidayRepository.findAll(collegeId);
        const matched = holidays.find((h) => h.holiday_date === dateStr && h.is_service_disabled);
        if (matched) {
            return { isHoliday: true, holiday: matched };
        }
        return { isHoliday: false };
    }
    /**
     * Add a college holiday in Supabase
     */
    static async addHoliday(data) {
        return holidayRepository_1.HolidayRepository.create({
            college_id: data.college_id,
            holiday_date: data.holiday_date,
            title: data.title,
            holiday_type: data.holiday_type,
            is_service_disabled: data.is_service_disabled,
        });
    }
}
exports.HolidayService = HolidayService;
//# sourceMappingURL=holidayService.js.map