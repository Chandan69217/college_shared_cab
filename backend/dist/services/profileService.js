"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProfileService = void 0;
const userRepository_1 = require("../repositories/userRepository");
const supabaseClient_1 = require("../database/supabaseClient");
class ProfileService {
    /**
     * Get full user profile with role-specific profile and college association
     */
    static async getProfile(userId) {
        const user = await userRepository_1.UserRepository.findById(userId);
        if (!user) {
            const err = new Error('User profile not found.');
            err.statusCode = 404;
            err.code = 'USER_NOT_FOUND';
            throw err;
        }
        let profile = null;
        if (user.role === 'STUDENT') {
            profile = await userRepository_1.UserRepository.getStudentProfile(userId);
        }
        else if (user.role === 'DRIVER') {
            profile = await userRepository_1.UserRepository.getDriverProfile(userId);
        }
        else if (user.role === 'ADMIN') {
            profile = await userRepository_1.UserRepository.getAdminProfile(userId);
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
    static async updateProfile(userId, updates) {
        const user = await userRepository_1.UserRepository.findById(userId);
        if (!user) {
            const err = new Error('User profile not found.');
            err.statusCode = 404;
            err.code = 'USER_NOT_FOUND';
            throw err;
        }
        // Check if new email/phone already taken by another account
        if (updates.email && updates.email.toLowerCase() !== user.email.toLowerCase()) {
            const existing = await userRepository_1.UserRepository.findByEmailOrPhone(updates.email);
            if (existing && existing.id !== userId) {
                const err = new Error('This email address is already in use by another account.');
                err.statusCode = 409;
                err.code = 'EMAIL_EXISTS';
                throw err;
            }
        }
        if (updates.phone && updates.phone.trim() !== user.phone?.trim()) {
            const existing = await userRepository_1.UserRepository.findByEmailOrPhone(updates.phone);
            if (existing && existing.id !== userId) {
                const err = new Error('This phone number is already registered with another account.');
                err.statusCode = 409;
                err.code = 'PHONE_EXISTS';
                throw err;
            }
        }
        // 1. Update Core User table
        const userUpdates = {};
        if (updates.full_name)
            userUpdates.full_name = updates.full_name.trim();
        if (updates.email)
            userUpdates.email = updates.email.trim().toLowerCase();
        if (updates.phone)
            userUpdates.phone = updates.phone.trim();
        if (updates.profile_photo_url !== undefined)
            userUpdates.avatar_url = updates.profile_photo_url;
        if (Object.keys(userUpdates).length > 0) {
            await userRepository_1.UserRepository.updateUser(userId, userUpdates);
        }
        // 2. Update Role-specific profile table
        if (user.role === 'STUDENT') {
            const studentUpdates = {};
            if (updates.course)
                studentUpdates.course = updates.course;
            if (updates.semester !== undefined)
                studentUpdates.semester = updates.semester;
            if (updates.student_id_number)
                studentUpdates.student_id_number = updates.student_id_number;
            if (updates.roll_number !== undefined)
                studentUpdates.roll_number = updates.roll_number;
            if (Object.keys(studentUpdates).length > 0) {
                await userRepository_1.UserRepository.updateStudentProfile(userId, studentUpdates);
            }
        }
        else if (user.role === 'DRIVER') {
            const driverUpdates = {};
            if (updates.license_number)
                driverUpdates.license_number = updates.license_number;
            if (Object.keys(driverUpdates).length > 0) {
                await userRepository_1.UserRepository.updateDriverProfile(userId, driverUpdates);
            }
        }
        else if (user.role === 'ADMIN') {
            const adminUpdates = {};
            if (updates.department)
                adminUpdates.department = updates.department;
            if (updates.full_name)
                adminUpdates.full_name = updates.full_name;
            if (Object.keys(adminUpdates).length > 0) {
                await userRepository_1.UserRepository.updateAdminProfile(userId, adminUpdates);
            }
        }
        return this.getProfile(userId);
    }
    /**
     * Secure user account deletion with active relationship checks
     */
    static async deleteProfile(userId) {
        const user = await userRepository_1.UserRepository.findById(userId);
        if (!user) {
            const err = new Error('User not found.');
            err.statusCode = 404;
            err.code = 'USER_NOT_FOUND';
            throw err;
        }
        const client = (0, supabaseClient_1.getSupabaseClient)();
        if (!client)
            throw new Error('Database client not initialized.');
        if (user.role === 'STUDENT') {
            await userRepository_1.UserRepository.deleteStudent(userId);
        }
        else if (user.role === 'DRIVER') {
            await userRepository_1.UserRepository.deleteDriver(userId);
        }
        else if (user.role === 'ADMIN') {
            // Check if this is the only admin
            const allAdmins = await userRepository_1.UserRepository.getAllAdmins();
            if (allAdmins.length <= 1) {
                const err = new Error('Cannot delete the primary/last system administrator account.');
                err.statusCode = 403;
                err.code = 'LAST_ADMIN_PROTECTED';
                throw err;
            }
            await client.from('admin_profiles').delete().eq('id', userId);
            await client.from('users').delete().eq('id', userId);
        }
        else {
            await client.from('users').delete().eq('id', userId);
        }
        return {
            success: true,
            message: 'Your account has been deleted permanently and your session has been invalidated.',
        };
    }
}
exports.ProfileService = ProfileService;
//# sourceMappingURL=profileService.js.map