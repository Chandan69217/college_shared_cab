import { CollegeHoliday } from '../types';
import { HolidayRepository } from '../repositories/holidayRepository';

export class HolidayService {
  /**
   * Check if a given date is a non-service holiday in Supabase
   */
  public static async isHoliday(collegeId: string, dateStr: string): Promise<{ isHoliday: boolean; holiday?: CollegeHoliday }> {
    const holidays = await HolidayRepository.findAll(collegeId);
    const matched = holidays.find((h) => h.holiday_date === dateStr && h.is_service_disabled);
    if (matched) {
      return { isHoliday: true, holiday: matched };
    }
    return { isHoliday: false };
  }

  /**
   * Add a college holiday in Supabase
   */
  public static async addHoliday(data: {
    college_id: string;
    holiday_date: string;
    title: string;
    holiday_type: 'COLLEGE_HOLIDAY' | 'EXAM_HOLIDAY' | 'SUNDAY' | 'SPECIAL';
    is_service_disabled: boolean;
  }): Promise<CollegeHoliday> {
    return HolidayRepository.create({
      college_id: data.college_id,
      holiday_date: data.holiday_date,
      title: data.title,
      holiday_type: data.holiday_type,
      is_service_disabled: data.is_service_disabled,
    });
  }
}
