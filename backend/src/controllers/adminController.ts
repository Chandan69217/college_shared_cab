import { Request, Response, NextFunction } from 'express';
import { AdminService } from '../services/adminService';
import { UserRepository } from '../repositories/userRepository';
import { SubscriptionRepository } from '../repositories/subscriptionRepository';
import { sendSuccess } from '../utils/response';
import { getSupabaseClient } from '../database/supabaseClient';
import {
  createAdminSchema,
  createAdminProfileSchema,
  updateAdminProfileSchema,
} from '../validators/schemas';

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
      const students = await UserRepository.getAllStudents();
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
      const drivers = await UserRepository.getAllDrivers();
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

  public static async getAdmins(req: Request, res: Response, next: NextFunction) {
    try {
      const admins = await UserRepository.getAllAdmins();
      sendSuccess(res, 'Admins list retrieved.', admins);
    } catch (err) {
      next(err);
    }
  }

  public static async createAdmin(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = createAdminSchema.parse(req.body);
      const result = await AdminService.createAdmin(validated);
      sendSuccess(res, 'Admin created successfully.', result, 201);
    } catch (err) {
      next(err);
    }
  }

  public static async createAdminProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = createAdminProfileSchema.parse(req.body);
      const targetUserId = validated.user_id || req.user?.userId;
      if (!targetUserId) {
        const err: any = new Error('User ID is required.');
        err.statusCode = 400;
        throw err;
      }
      const profile = await AdminService.createOrUpdateAdminProfile(targetUserId, validated);
      sendSuccess(res, 'Admin profile created/updated successfully.', profile, 201);
    } catch (err) {
      next(err);
    }
  }

  public static async getAdminProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const profile = await UserRepository.getAdminProfile(userId);
      sendSuccess(res, 'Admin profile retrieved.', profile);
    } catch (err) {
      next(err);
    }
  }

  public static async updateAdminProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const validated = updateAdminProfileSchema.parse(req.body);
      const profile = await UserRepository.updateAdminProfile(userId, validated);
      sendSuccess(res, 'Admin profile updated.', profile);
    } catch (err) {
      next(err);
    }
  }

  public static async createStudent(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AdminService.createStudent(req.body);
      sendSuccess(res, 'Student created successfully.', result, 201);
    } catch (err) {
      next(err);
    }
  }

  public static async updateStudent(req: Request, res: Response, next: NextFunction) {
    try {
      const studentId = req.params.studentId || req.params.id;
      const updated = await AdminService.updateStudent(studentId, req.body);
      sendSuccess(res, 'Student updated successfully.', updated);
    } catch (err) {
      next(err);
    }
  }

  public static async deleteStudent(req: Request, res: Response, next: NextFunction) {
    try {
      const studentId = req.params.studentId || req.params.id;
      await AdminService.deleteStudent(studentId);
      sendSuccess(res, 'Student deleted successfully.');
    } catch (err) {
      next(err);
    }
  }

  public static async bulkUpdateStudents(req: Request, res: Response, next: NextFunction) {
    try {
      const studentIds = req.body.student_ids || req.body.userIds || [];
      const { action, notes, updates } = req.body;
      const result = await AdminService.bulkUpdateStudents(studentIds, action, notes, updates);
      sendSuccess(res, `Bulk operation completed for ${result.processedCount} students.`, result);
    } catch (err) {
      next(err);
    }
  }

  public static async updateDriver(req: Request, res: Response, next: NextFunction) {
    try {
      const driverId = req.params.driverId || req.params.id;
      const updated = await AdminService.updateDriver(driverId, req.body);
      sendSuccess(res, 'Driver updated successfully.', updated);
    } catch (err) {
      next(err);
    }
  }

  public static async deleteDriver(req: Request, res: Response, next: NextFunction) {
    try {
      const driverId = req.params.driverId || req.params.id;
      await AdminService.deleteDriver(driverId);
      sendSuccess(res, 'Driver deleted successfully.');
    } catch (err) {
      next(err);
    }
  }

  public static async updateVehicle(req: Request, res: Response, next: NextFunction) {
    try {
      const vehicleId = req.params.vehicleId || req.params.id;
      const updated = await AdminService.updateVehicle(vehicleId, req.body);
      sendSuccess(res, 'Vehicle updated successfully.', updated);
    } catch (err) {
      next(err);
    }
  }

  public static async deleteVehicle(req: Request, res: Response, next: NextFunction) {
    try {
      const vehicleId = req.params.vehicleId || req.params.id;
      await AdminService.deleteVehicle(vehicleId);
      sendSuccess(res, 'Vehicle deleted successfully.');
    } catch (err) {
      next(err);
    }
  }

  public static async updateRoute(req: Request, res: Response, next: NextFunction) {
    try {
      const routeId = req.params.routeId || req.params.id;
      const { stops, ...routeData } = req.body;
      const updated = await AdminService.updateRoute(routeId, routeData, stops);
      sendSuccess(res, 'Route updated successfully.', updated);
    } catch (err) {
      next(err);
    }
  }

  public static async deleteRoute(req: Request, res: Response, next: NextFunction) {
    try {
      const routeId = req.params.routeId || req.params.id;
      await AdminService.deleteRoute(routeId);
      sendSuccess(res, 'Route deleted successfully.');
    } catch (err) {
      next(err);
    }
  }

  public static async getAssignments(req: Request, res: Response, next: NextFunction) {
    try {
      const assignments = await AdminService.getAssignmentsSummary();
      sendSuccess(res, 'Assignments matrix retrieved.', assignments);
    } catch (err) {
      next(err);
    }
  }

  public static async allocateRouteResources(req: Request, res: Response, next: NextFunction) {
    try {
      const { route_id, default_vehicle_id, default_driver_id } = req.body;
      const updated = await AdminService.allocateRouteResources(route_id, {
        default_vehicle_id,
        default_driver_id,
      });
      sendSuccess(res, 'Route resource allocation updated successfully.', updated);
    } catch (err) {
      next(err);
    }
  }

  public static async getSubscriptions(req: Request, res: Response, next: NextFunction) {
    try {
      const subscriptions = await SubscriptionRepository.findAll();
      sendSuccess(res, 'Subscriptions list retrieved.', subscriptions);
    } catch (err) {
      next(err);
    }
  }

  public static async getAuditLogs(req: Request, res: Response, next: NextFunction) {
    try {
      const supabase = getSupabaseClient();
      let logs: any[] = [];
      if (supabase) {
        const { data } = await supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(100);
        logs = data || [];
      }
      sendSuccess(res, 'Audit logs retrieved.', logs);
    } catch (err) {
      next(err);
    }
  }
}
