import { db } from '../database/db';
import { CollegeHoliday } from '../types';

export class HolidayService {
  /**
   * Check if a given date is a non-service holiday
   */
  public static async isHoliday(collegeId: string, dateStr: string): Promise<{ isHoliday: boolean; holiday?: CollegeHoliday }> {
    for (const holiday of db.holidays.values()) {
      if (holiday.college_id === collegeId && holiday.holiday_date === dateStr && holiday.is_service_disabled) {
        return { isHoliday: true, holiday };
      }
    }
    return { isHoliday: false };
  }

  /**
   * Add a college holiday
   */
  public static async addHoliday(data: {
    college_id: string;
    holiday_date: string;
    title: string;
    holiday_type: 'COLLEGE_HOLIDAY' | 'EXAM_HOLIDAY' | 'SUNDAY' | 'SPECIAL';
    is_service_disabled: boolean;
  }): Promise<CollegeHoliday> {
    const id = `hol-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const holiday: CollegeHoliday = {
      id,
      college_id: data.college_id,
      holiday_date: data.holiday_date,
      title: data.title,
      holiday_type: data.holiday_type,
      is_service_disabled: data.is_service_disabled,
      created_at: new Date().toISOString(),
    };

    db.holidays.set(id, holiday);
    return holiday;
  }
}
