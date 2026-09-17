import { VerificationStatus, UserStatus, DriverStatus, VehicleStatus } from '../types';
import { NotificationProvider } from '../integrations/notificationProvider';
import { NotificationService } from './notificationService';
import { hashPassword } from '../utils/crypto';
import { UserRepository } from '../repositories/userRepository';
import { ReportRepository } from '../repositories/reportRepository';
import { VehicleRepository } from '../repositories/vehicleRepository';
import { RouteRepository } from '../repositories/routeRepository';
import { TripRepository } from '../repositories/tripRepository';
import { CollegeRepository } from '../repositories/collegeRepository';
import { getSupabaseClient } from '../database/supabaseClient';

export class AdminService {
  /**
   * Get Admin Dashboard Overview dynamic metrics directly from Supabase
   */
  public static async getDashboardStats() {
    return ReportRepository.getDashboardStats();
  }

  /**
   * Review and update student verification status in Supabase
   */
  public static async updateStudentVerification(
    studentId: string,
    status: VerificationStatus,
    adminId: string,
    notes?: string
  ) {
    const profile = await UserRepository.updateStudentProfile(studentId, {
      verification_status: status,
      verification_notes: notes,
      verified_at: new Date().toISOString(),
      verified_by: adminId,
    });

    try {
      await NotificationService.createNotification({
        userId: studentId,
        recipientRole: 'STUDENT',
        title: status === 'VERIFIED' ? 'Student Verification Approved!' : 'Verification Status Update',
        message: status === 'VERIFIED'
          ? 'Your student profile has been verified. You can now book daily cabs.'
          : `Your verification status has been updated to ${status}. Notes: ${notes || 'None'}`,
        type: status === 'VERIFIED' ? 'ACCOUNT_VERIFIED' : 'ACCOUNT_REJECTED',
        entityType: 'KYC',
        entityId: studentId,
        priority: status === 'VERIFIED' ? 'HIGH' : 'NORMAL',
        data: { status, notes },
      });
    } catch (notifErr) {
      // Non-blocking notification error
    }

    return profile;
  }

  /**
   * Create a new student commuter account (User + Student Profile)
   */
  public static async createStudent(data: {
    college_id?: string;
    college_code?: string;
    email: string;
    phone: string;
    full_name: string;
    password?: string;
    student_id_number: string;
    roll_number?: string;
    course: string;
    semester: number;
    verification_status?: VerificationStatus;
  }) {
    const existing = await UserRepository.findByEmailOrPhone(data.email);
    if (existing) {
      const err: any = new Error('An account with this email/phone already exists.');
      err.statusCode = 409;
      err.code = 'USER_EXISTS';
      throw err;
    }

    let collegeId = data.college_id;
    if (!collegeId && data.college_code) {
      const college = await CollegeRepository.findByCode(data.college_code);
      if (college) {
        collegeId = college.id;
      }
    }

    if (!collegeId) {
      const colleges = await CollegeRepository.findAll();
      if (colleges.length > 0) {
        collegeId = colleges[0].id;
      }
    }

    const pwHash = await hashPassword(data.password || 'Student@123');
    const user = await UserRepository.createUser({
      email: data.email.toLowerCase(),
      phone: data.phone,
      full_name: data.full_name,
      password_hash: pwHash,
      role: 'STUDENT',
      status: 'ACTIVE',
    });

    const profile = await UserRepository.createStudentProfile({
      id: user.id,
      college_id: collegeId!,
      student_id_number: data.student_id_number,
      roll_number: data.roll_number || data.student_id_number,
      course: data.course,
      semester: data.semester || 1,
      verification_status: data.verification_status || 'VERIFIED',
    });

    return { user, profile };
  }

  /**
   * Update student user and profile information
   */
  public static async updateStudent(
    studentId: string,
    data: {
      college_id?: string;
      full_name?: string;
      phone?: string;
      course?: string;
      semester?: number;
      student_id_number?: string;
      roll_number?: string;
      status?: UserStatus;
      verification_status?: VerificationStatus;
      verification_notes?: string;
    }
  ) {
    const userUpdates: any = {};
    if (data.full_name) userUpdates.full_name = data.full_name;
    if (data.phone) userUpdates.phone = data.phone;
    if (data.status) userUpdates.status = data.status;

    if (Object.keys(userUpdates).length > 0) {
      await UserRepository.updateUser(studentId, userUpdates);
    }

    const profileUpdates: any = {};
    if (data.college_id) profileUpdates.college_id = data.college_id;
    if (data.course) profileUpdates.course = data.course;
    if (data.semester !== undefined) profileUpdates.semester = data.semester;
    if (data.student_id_number) profileUpdates.student_id_number = data.student_id_number;
    if (data.roll_number !== undefined) profileUpdates.roll_number = data.roll_number;
    if (data.verification_status) profileUpdates.verification_status = data.verification_status;
    if (data.verification_notes !== undefined) profileUpdates.verification_notes = data.verification_notes;

    if (Object.keys(profileUpdates).length > 0) {
      await UserRepository.updateStudentProfile(studentId, profileUpdates);
    }

    return UserRepository.getStudentProfile(studentId);
  }

  /**
   * Delete student safely
   */
  public static async deleteStudent(studentId: string) {
    return UserRepository.deleteStudent(studentId);
  }

  /**
   * Bulk update student statuses
   */
  public static async bulkUpdateStudents(
    studentIds: string[],
    action?: 'VERIFY' | 'REJECT' | 'SUSPEND' | 'ACTIVATE' | string,
    notes?: string,
    updates?: { verification_status?: VerificationStatus; user_status?: UserStatus }
  ) {
    if (!studentIds || studentIds.length === 0) {
      const err: any = new Error('No students selected for bulk operation.');
      err.statusCode = 400;
      err.code = 'VALIDATION_ERROR';
      throw err;
    }

    const results = [];
    for (const id of studentIds) {
      if (updates) {
        if (updates.user_status) {
          await UserRepository.updateUser(id, { status: updates.user_status });
        }
        if (updates.verification_status) {
          await UserRepository.updateStudentProfile(id, {
            verification_status: updates.verification_status,
            verification_notes: notes || `Bulk updated: ${updates.verification_status}`,
            ...(updates.verification_status === 'VERIFIED' ? { verified_at: new Date().toISOString() } : {}),
          });
        }
      } else if (action === 'VERIFY') {
        await UserRepository.updateStudentProfile(id, {
          verification_status: 'VERIFIED',
          verification_notes: notes || 'Bulk verified by Administrator',
          verified_at: new Date().toISOString(),
        });
      } else if (action === 'REJECT') {
        await UserRepository.updateStudentProfile(id, {
          verification_status: 'REJECTED',
          verification_notes: notes || 'Bulk rejected by Administrator',
        });
      } else if (action === 'SUSPEND') {
        await UserRepository.updateUser(id, { status: 'SUSPENDED' });
        await UserRepository.updateStudentProfile(id, {
          verification_status: 'SUSPENDED',
          verification_notes: notes || 'Account suspended by Administrator',
        });
      } else if (action === 'ACTIVATE') {
        await UserRepository.updateUser(id, { status: 'ACTIVE' });
      }
      results.push(id);
    }

    return { processedCount: results.length, studentIds: results };
  }

  /**
   * Create a new driver account in Supabase
   */
  public static async createDriver(data: {
    college_id?: string;
    email: string;
    phone: string;
    full_name: string;
    password: string;
    license_number: string;
    license_expiry: string;
    aadhar_number?: string;
    experience_years: number;
    status?: DriverStatus;
  }) {
    const existing = await UserRepository.findByEmailOrPhone(data.email);
    if (existing) {
      const err: any = new Error('An account with this email/phone already exists.');
      err.statusCode = 409;
      err.code = 'USER_EXISTS';
      throw err;
    }

    let collegeId = data.college_id;
    if (!collegeId) {
      const colleges = await CollegeRepository.findAll();
      if (colleges.length > 0) {
        collegeId = colleges[0].id;
      }
    }

    const pwHash = await hashPassword(data.password);
    const user = await UserRepository.createUser({
      email: data.email.toLowerCase(),
      phone: data.phone,
      full_name: data.full_name,
      password_hash: pwHash,
      role: 'DRIVER',
      status: 'ACTIVE',
    });

    const profile = await UserRepository.createDriverProfile({
      id: user.id,
      college_id: collegeId!,
      license_number: data.license_number,
      license_expiry: data.license_expiry,
      aadhar_number: data.aadhar_number,
      experience_years: data.experience_years || 1,
      status: data.status || 'ACTIVE',
      rating_avg: 5.0,
      total_trips: 0,
    });

    return { user, profile };
  }

  /**
   * Update driver user and profile information
   */
  public static async updateDriver(
    driverId: string,
    data: {
      college_id?: string;
      full_name?: string;
      phone?: string;
      license_number?: string;
      license_expiry?: string;
      experience_years?: number;
      aadhar_number?: string;
      status?: DriverStatus;
    }
  ) {
    const userUpdates: any = {};
    if (data.full_name) userUpdates.full_name = data.full_name;
    if (data.phone) userUpdates.phone = data.phone;

    if (Object.keys(userUpdates).length > 0) {
      await UserRepository.updateUser(driverId, userUpdates);
    }

    const profileUpdates: any = {};
    if (data.college_id) profileUpdates.college_id = data.college_id;
    if (data.license_number) profileUpdates.license_number = data.license_number;
    if (data.license_expiry) profileUpdates.license_expiry = data.license_expiry;
    if (data.experience_years !== undefined) profileUpdates.experience_years = data.experience_years;
    if (data.aadhar_number !== undefined) profileUpdates.aadhar_number = data.aadhar_number;
    if (data.status) profileUpdates.status = data.status;

    if (Object.keys(profileUpdates).length > 0) {
      await UserRepository.updateDriverProfile(driverId, profileUpdates);
    }

    return UserRepository.getDriverProfile(driverId);
  }

  /**
   * Delete driver safely
   */
  public static async deleteDriver(driverId: string) {
    return UserRepository.deleteDriver(driverId);
  }

  /**
   * Update vehicle in Supabase
   */
  public static async updateVehicle(
    vehicleId: string,
    updates: {
      vehicle_number?: string;
      model?: string;
      type?: any;
      seating_capacity?: number;
      registration_number?: string;
      insurance_validity?: string;
      fitness_validity?: string;
      status?: VehicleStatus;
    }
  ) {
    return VehicleRepository.update(vehicleId, updates);
  }

  /**
   * Delete vehicle safely
   */
  public static async deleteVehicle(vehicleId: string) {
    return VehicleRepository.delete(vehicleId);
  }

  /**
   * Update route and stop sequence in Supabase
   */
  public static async updateRoute(
    routeId: string,
    updates: {
      name?: string;
      code?: string;
      description?: string;
      morning_departure_time?: string;
      evening_departure_time?: string;
      estimated_duration_mins?: number;
      default_vehicle_id?: string | null;
      default_driver_id?: string | null;
      max_capacity?: number;
      is_active?: boolean;
    },
    stops?: any[]
  ) {
    const updated = await RouteRepository.update(routeId, updates, stops);
    const todayIST = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());
    await TripRepository.syncDailyTripsForDate(todayIST, routeId);
    return updated;
  }

  /**
   * Delete route safely
   */
  public static async deleteRoute(routeId: string) {
    return RouteRepository.delete(routeId);
  }

  /**
   * Centralized Assignment Matrix Overview
   */
  public static async getAssignmentsSummary() {
    const supabase = getSupabaseClient()!;

    // 1. Fetch routes with assigned vehicles & drivers
    const routes = await RouteRepository.findAll();

    // 2. Fetch all active vehicles
    const vehicles = await VehicleRepository.findAll();

    // 3. Fetch all active drivers
    const drivers = await UserRepository.getAllDrivers();

    // 4. Fetch subscription and booking allocations per route
    const { data: routeBookings } = await supabase
      .from('bookings')
      .select('route_id, status')
      .eq('status', 'CONFIRMED');

    const bookingCounts: Record<string, number> = {};
    (routeBookings || []).forEach((b: any) => {
      bookingCounts[b.route_id] = (bookingCounts[b.route_id] || 0) + 1;
    });

    const routeAssignments = routes.map((r: any) => {
      const assignedVehicle = vehicles.find((v) => v.id === r.default_vehicle_id);
      const assignedDriver = drivers.find((d) => d.id === r.default_driver_id);
      const activeBookingsCount = bookingCounts[r.id] || 0;
      const capacity = assignedVehicle?.seating_capacity || r.max_capacity || 6;
      const isCapacityReached = activeBookingsCount >= capacity;

      return {
        routeId: r.id,
        routeName: r.name,
        routeCode: r.code,
        morningDeparture: r.morning_departure_time,
        eveningDeparture: r.evening_departure_time,
        assignedVehicle: assignedVehicle
          ? {
              id: assignedVehicle.id,
              vehicleNumber: assignedVehicle.vehicle_number,
              model: assignedVehicle.model,
              type: assignedVehicle.type,
              seatingCapacity: assignedVehicle.seating_capacity,
              status: assignedVehicle.status,
            }
          : null,
        assignedDriver: assignedDriver
          ? {
              id: assignedDriver.id,
              fullName: assignedDriver.full_name,
              phone: assignedDriver.phone,
              licenseNumber: assignedDriver.profile?.license_number,
              status: assignedDriver.profile?.status,
            }
          : null,
        capacity,
        activeBookingsCount,
        isCapacityReached,
        status: r.is_active ? 'ACTIVE' : 'INACTIVE',
      };
    });

    return {
      routes: routeAssignments,
      availableVehicles: vehicles.filter((v) => v.status === 'ACTIVE'),
      availableDrivers: drivers.filter((d) => d.profile?.status === 'ACTIVE'),
    };
  }

  /**
   * Allocate Route Driver & Vehicle with validation
   */
  public static async allocateRouteResources(
    routeId: string,
    data: {
      default_vehicle_id?: string | null;
      default_driver_id?: string | null;
    }
  ) {
    const route = await RouteRepository.findById(routeId);
    if (!route) {
      const err: any = new Error('Route not found.');
      err.statusCode = 404;
      err.code = 'NOT_FOUND';
      throw err;
    }

    // Validate Vehicle if provided
    if (data.default_vehicle_id) {
      const vehicle = await VehicleRepository.findById(data.default_vehicle_id);
      if (!vehicle) {
        const err: any = new Error('Selected vehicle not found.');
        err.statusCode = 404;
        err.code = 'NOT_FOUND';
        throw err;
      }
      if (vehicle.status !== 'ACTIVE') {
        const err: any = new Error(
          `Cannot assign vehicle in ${vehicle.status} status. Vehicle must be ACTIVE.`
        );
        err.statusCode = 400;
        err.code = 'VALIDATION_ERROR';
        throw err;
      }
    }

    // Validate Driver if provided
    if (data.default_driver_id) {
      const driver = await UserRepository.getDriverProfile(data.default_driver_id);
      if (!driver) {
        const err: any = new Error('Selected driver not found.');
        err.statusCode = 404;
        err.code = 'NOT_FOUND';
        throw err;
      }
      if (driver.status !== 'ACTIVE') {
        const err: any = new Error(
          `Cannot assign driver with status ${driver.status}. Driver must be ACTIVE and not on leave.`
        );
        err.statusCode = 400;
        err.code = 'VALIDATION_ERROR';
        throw err;
      }
    }

    const finalVehicleId = data.default_vehicle_id !== undefined ? data.default_vehicle_id : route.default_vehicle_id;
    const finalDriverId = data.default_driver_id !== undefined ? data.default_driver_id : route.default_driver_id;

    const updated = await RouteRepository.update(routeId, {
      default_vehicle_id: finalVehicleId,
      default_driver_id: finalDriverId,
      is_active: true,
    });

    // Synchronize scheduled trips for today & future
    const todayIST = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());
    await TripRepository.syncDailyTripsForDate(todayIST, routeId);

    return updated;
  }

  /**
   * Create a new admin account (User + Admin Profile) in Supabase
   */
  public static async createAdmin(data: {
    email: string;
    phone: string;
    full_name: string;
    password: string;
    department?: string;
    permissions?: string[];
  }) {
    const existing = await UserRepository.findByEmailOrPhone(data.email);
    if (existing) {
      const err: any = new Error('An account with this email/phone already exists.');
      err.statusCode = 409;
      err.code = 'USER_EXISTS';
      throw err;
    }

    const pwHash = await hashPassword(data.password);
    const user = await UserRepository.createUser({
      email: data.email.toLowerCase(),
      phone: data.phone,
      full_name: data.full_name,
      password_hash: pwHash,
      role: 'ADMIN',
      status: 'ACTIVE',
    });

    const profile = await UserRepository.createAdminProfile({
      id: user.id,
      full_name: data.full_name,
      department: data.department || 'Operations',
      permissions: data.permissions || ['ALL'],
    });

    return { user, profile };
  }

  /**
   * Create or update an admin profile for an existing user
   */
  public static async createOrUpdateAdminProfile(userId: string, data: {
    full_name?: string;
    department?: string;
    permissions?: string[];
  }) {
    const user = await UserRepository.findById(userId);
    if (!user) {
      const err: any = new Error('User not found.');
      err.statusCode = 404;
      err.code = 'USER_NOT_FOUND';
      throw err;
    }

    if (user.role !== 'ADMIN') {
      await UserRepository.updateUser(userId, { role: 'ADMIN' });
    }

    const fullName = data.full_name || user.full_name;
    const profile = await UserRepository.upsertAdminProfile({
      id: userId,
      full_name: fullName,
      department: data.department || 'Operations',
      permissions: data.permissions || ['ALL'],
    });

    return profile;
  }
}
