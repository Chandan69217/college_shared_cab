import { CollegeHoliday } from '../types';
export declare class HolidayService {
    /**
     * Check if a given date is a non-service holiday
     */
    static isHoliday(collegeId: string, dateStr: string): Promise<{
        isHoliday: boolean;
        holiday?: CollegeHoliday;
    }>;
    /**
     * Add a college holiday
     */
    static addHoliday(data: {
        college_id: string;
        holiday_date: string;
        title: string;
        holiday_type: 'COLLEGE_HOLIDAY' | 'EXAM_HOLIDAY' | 'SUNDAY' | 'SPECIAL';
        is_service_disabled: boolean;
    }): Promise<CollegeHoliday>;
}
