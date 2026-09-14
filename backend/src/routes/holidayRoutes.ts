import { Router } from 'express';
import { HolidayController } from '../controllers/holidayController';
import { authenticateJwt } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { auditLog } from '../middleware/auditLog';

const router = Router();

// Publicly view holidays
router.get('/', HolidayController.getHolidays);

// Admin add holiday
router.post('/', authenticateJwt, requireRole(['ADMIN']), auditLog('CREATE_HOLIDAY', 'college_holidays'), HolidayController.createHoliday);

export default router;
