import { Request, Response, NextFunction } from 'express';
import { AdminService } from '../services/adminService';
import { db } from '../database/db';
import { sendSuccess } from '../utils/response';

export class AdminController {
  public static async getDashboardStats(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await AdminService.getDashboardStats();
      sendSuccess(res, 'Admin stats retrieved.', stats);
    } catch (err) {
      next(err);
    }
  }

  public static async getStudents(req: Request, res: Response, next: NextFunction) {
    try {
      const students: any[] = [];
      for (const [id, user] of db.users.entries()) {
        if (user.role === 'STUDENT') {
          const profile = db.studentProfiles.get(id);
          students.push({
            ...user,
            password_hash: undefined,
            profile,
          });
        }
      }
      sendSuccess(res, 'Students list retrieved.', students);
    } catch (err) {
      next(err);
    }
  }

  public static async verifyStudent(req: Request, res: Response, next: NextFunction) {
    try {
      const studentId = req.params.studentId;
      const { status, notes } = req.body;
      const adminId = req.user!.userId;
      const profile = await AdminService.updateStudentVerification(studentId, status, adminId, notes);
      sendSuccess(res, `Student status updated to ${status}.`, profile);
    } catch (err) {
      next(err);
    }
  }

  public static async getDrivers(req: Request, res: Response, next: NextFunction) {
    try {
      const drivers: any[] = [];
      for (const [id, user] of db.users.entries()) {
        if (user.role === 'DRIVER') {
          const profile = db.driverProfiles.get(id);
          drivers.push({
            ...user,
            password_hash: undefined,
            profile,
          });
        }
      }
      sendSuccess(res, 'Drivers list retrieved.', drivers);
    } catch (err) {
      next(err);
    }
  }

  public static async createDriver(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AdminService.createDriver(req.body);
      sendSuccess(res, 'Driver created successfully.', result, 201);
    } catch (err) {
      next(err);
    }
  }

  public static async getAuditLogs(req: Request, res: Response, next: NextFunction) {
    try {
      sendSuccess(res, 'Audit logs retrieved.', db.auditLogs.slice(-100).reverse());
    } catch (err) {
      next(err);
    }
  }
}
