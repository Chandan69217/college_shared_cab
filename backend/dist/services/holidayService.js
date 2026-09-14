"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HolidayService = void 0;
const db_1 = require("../database/db");
class HolidayService {
    /**
     * Check if a given date is a non-service holiday
     */
    static async isHoliday(collegeId, dateStr) {
        for (const holiday of db_1.db.holidays.values()) {
            if (holiday.college_id === collegeId && holiday.holiday_date === dateStr && holiday.is_service_disabled) {
                return { isHoliday: true, holiday };
            }
        }
        return { isHoliday: false };
    }
    /**
     * Add a college holiday
     */
    static async addHoliday(data) {
        const id = `hol-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
        const holiday = {
            id,
            college_id: data.college_id,
            holiday_date: data.holiday_date,
            title: data.title,
            holiday_type: data.holiday_type,
            is_service_disabled: data.is_service_disabled,
            created_at: new Date().toISOString(),
        };
        db_1.db.holidays.set(id, holiday);
        return holiday;
    }
}
exports.HolidayService = HolidayService;
//# sourceMappingURL=holidayService.js.map