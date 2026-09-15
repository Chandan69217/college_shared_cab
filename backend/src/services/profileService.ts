import { UserRepository } from '../repositories/userRepository';
import { getSupabaseClient } from '../database/supabaseClient';
import { User, StudentProfile, DriverProfile, AdminProfile } from '../types';

export class ProfileService {
  /**
   * Get full user profile with role-specific profile and college association
   */
  public static async getProfile(userId: string) {
    const user = await UserRepository.findById(userId);
    if (!user) {
      const err: any = new Error('User profile not found.');
      err.statusCode = 404;
      err.code = 'USER_NOT_FOUND';
      throw err;
    }

    let profile: StudentProfile | DriverProfile | AdminProfile | null = null;
    if (user.role === 'STUDENT') {
      profile = await UserRepository.getStudentProfile(userId);
    } else if (user.role === 'DRIVER') {
      profile = await UserRepository.getDriverProfile(userId);
    } else if (user.role === 'ADMIN') {
      profile = await UserRepository.getAdminProfile(userId);
    }

    return {
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        full_name: user.full_name,
        role: user.role,
        status: user.status,
        avatar_url: user.avatar_url,
        created_at: user.created_at,
      },
      profile,
    };
  }

  /**
   * Update editable profile fields while blocking system/protected properties
   */
  public static async updateProfile(
    userId: string,
    updates: {
      full_name?: string;
      phone?: string;
      email?: string;
      profile_photo_url?: string;
      address?: string;
      course?: string;
      semester?: number;
      student_id_number?: string;
      roll_number?: string;
      license_number?: string;
      department?: string;
    }
  ) {
    const user = await UserRepository.findById(userId);
    if (!user) {
      const err: any = new Error('User profile not found.');
      err.statusCode = 404;
      err.code = 'USER_NOT_FOUND';
      throw err;
    }

    // Check if new email/phone already taken by another account
    if (updates.email && updates.email.toLowerCase() !== user.email.toLowerCase()) {
      const existing = await UserRepository.findByEmailOrPhone(updates.email);
      if (existing && existing.id !== userId) {
        const err: any = new Error('This email address is already in use by another account.');
        err.statusCode = 409;
        err.code = 'EMAIL_EXISTS';
        throw err;
      }
    }

    if (updates.phone && updates.phone.trim() !== user.phone?.trim()) {
      const existing = await UserRepository.findByEmailOrPhone(updates.phone);
      if (existing && existing.id !== userId) {
        const err: any = new Error('This phone number is already registered with another account.');
        err.statusCode = 409;
        err.code = 'PHONE_EXISTS';
        throw err;
      }
    }

    // 1. Update Core User table
    const userUpdates: Partial<User> = {};
    if (updates.full_name) userUpdates.full_name = updates.full_name.trim();
    if (updates.email) userUpdates.email = updates.email.trim().toLowerCase();
    if (updates.phone) userUpdates.phone = updates.phone.trim();
    if (updates.profile_photo_url !== undefined) userUpdates.avatar_url = updates.profile_photo_url;

    if (Object.keys(userUpdates).length > 0) {
      await UserRepository.updateUser(userId, userUpdates);
    }

    // 2. Update Role-specific profile table
    if (user.role === 'STUDENT') {
      const studentUpdates: Partial<StudentProfile> = {};
      if (updates.course) studentUpdates.course = updates.course;
      if (updates.semester !== undefined) studentUpdates.semester = updates.semester;
      if (updates.student_id_number) studentUpdates.student_id_number = updates.student_id_number;
      if (updates.roll_number !== undefined) studentUpdates.roll_number = updates.roll_number;

      if (Object.keys(studentUpdates).length > 0) {
        await UserRepository.updateStudentProfile(userId, studentUpdates);
      }
    } else if (user.role === 'DRIVER') {
      const driverUpdates: Partial<DriverProfile> = {};
      if (updates.license_number) driverUpdates.license_number = updates.license_number;

      if (Object.keys(driverUpdates).length > 0) {
        await UserRepository.updateDriverProfile(userId, driverUpdates);
      }
    } else if (user.role === 'ADMIN') {
      const adminUpdates: Partial<AdminProfile> = {};
      if (updates.department) adminUpdates.department = updates.department;
      if (updates.full_name) adminUpdates.full_name = updates.full_name;

      if (Object.keys(adminUpdates).length > 0) {
        await UserRepository.updateAdminProfile(userId, adminUpdates);
      }
    }

    return this.getProfile(userId);
  }

  /**
   * Secure user account deletion with active relationship checks
   */
  public static async deleteProfile(userId: string) {
    const user = await UserRepository.findById(userId);
    if (!user) {
      const err: any = new Error('User not found.');
      err.statusCode = 404;
      err.code = 'USER_NOT_FOUND';
      throw err;
    }

    const client = getSupabaseClient();
    if (!client) throw new Error('Database client not initialized.');

    if (user.role === 'STUDENT') {
      await UserRepository.deleteStudent(userId);
    } else if (user.role === 'DRIVER') {
      await UserRepository.deleteDriver(userId);
    } else if (user.role === 'ADMIN') {
      // Check if this is the only admin
      const allAdmins = await UserRepository.getAllAdmins();
      if (allAdmins.length <= 1) {
        const err: any = new Error('Cannot delete the primary/last system administrator account.');
        err.statusCode = 403;
        err.code = 'LAST_ADMIN_PROTECTED';
        throw err;
      }
      await client.from('admin_profiles').delete().eq('id', userId);
      await client.from('users').delete().eq('id', userId);
    } else {
      await client.from('users').delete().eq('id', userId);
    }

    return {
      success: true,
      message: 'Your account has been deleted permanently and your session has been invalidated.',
    };
  }
}
