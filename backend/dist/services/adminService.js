"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminService = void 0;
const notificationProvider_1 = require("../integrations/notificationProvider");
const crypto_1 = require("../utils/crypto");
const userRepository_1 = require("../repositories/userRepository");
const reportRepository_1 = require("../repositories/reportRepository");
const vehicleRepository_1 = require("../repositories/vehicleRepository");
const routeRepository_1 = require("../repositories/routeRepository");
const collegeRepository_1 = require("../repositories/collegeRepository");
const supabaseClient_1 = require("../database/supabaseClient");
class AdminService {
    /**
     * Get Admin Dashboard Overview dynamic metrics directly from Supabase
     */
    static async getDashboardStats() {
        return reportRepository_1.ReportRepository.getDashboardStats();
    }
    /**
     * Review and update student verification status in Supabase
     */
    static async updateStudentVerification(studentId, status, adminId, notes) {
        const profile = await userRepository_1.UserRepository.updateStudentProfile(studentId, {
            verification_status: status,
            verification_notes: notes,
            verified_at: new Date().toISOString(),
            verified_by: adminId,
        });
        await notificationProvider_1.NotificationProvider.send(studentId, status === 'VERIFIED' ? 'Student Verification Approved!' : 'Verification Status Update', status === 'VERIFIED'
            ? 'Your student profile has been verified. You can now book daily cabs.'
            : `Your verification status has been updated to ${status}. Notes: ${notes || 'None'}`, 'GENERAL');
        return profile;
    }
    /**
     * Create a new student commuter account (User + Student Profile)
     */
    static async createStudent(data) {
        const existing = await userRepository_1.UserRepository.findByEmailOrPhone(data.email);
        if (existing) {
            const err = new Error('An account with this email/phone already exists.');
            err.statusCode = 409;
            err.code = 'USER_EXISTS';
            throw err;
        }
        let collegeId = data.college_id;
        if (!collegeId && data.college_code) {
            const college = await collegeRepository_1.CollegeRepository.findByCode(data.college_code);
            if (college) {
                collegeId = college.id;
            }
        }
        if (!collegeId) {
            const colleges = await collegeRepository_1.CollegeRepository.findAll();
            if (colleges.length > 0) {
                collegeId = colleges[0].id;
            }
        }
        const pwHash = await (0, crypto_1.hashPassword)(data.password || 'Student@123');
        const user = await userRepository_1.UserRepository.createUser({
            email: data.email.toLowerCase(),
            phone: data.phone,
            full_name: data.full_name,
            password_hash: pwHash,
            role: 'STUDENT',
            status: 'ACTIVE',
        });
        const profile = await userRepository_1.UserRepository.createStudentProfile({
            id: user.id,
            college_id: collegeId,
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
    static async updateStudent(studentId, data) {
        const userUpdates = {};
        if (data.full_name)
            userUpdates.full_name = data.full_name;
        if (data.phone)
            userUpdates.phone = data.phone;
        if (data.status)
            userUpdates.status = data.status;
        if (Object.keys(userUpdates).length > 0) {
            await userRepository_1.UserRepository.updateUser(studentId, userUpdates);
        }
        const profileUpdates = {};
        if (data.college_id)
            profileUpdates.college_id = data.college_id;
        if (data.course)
            profileUpdates.course = data.course;
        if (data.semester !== undefined)
            profileUpdates.semester = data.semester;
        if (data.student_id_number)
            profileUpdates.student_id_number = data.student_id_number;
        if (data.roll_number !== undefined)
            profileUpdates.roll_number = data.roll_number;
        if (data.verification_status)
            profileUpdates.verification_status = data.verification_status;
        if (data.verification_notes !== undefined)
            profileUpdates.verification_notes = data.verification_notes;
        if (Object.keys(profileUpdates).length > 0) {
            await userRepository_1.UserRepository.updateStudentProfile(studentId, profileUpdates);
        }
        return userRepository_1.UserRepository.getStudentProfile(studentId);
    }
    /**
     * Delete student safely
     */
    static async deleteStudent(studentId) {
        return userRepository_1.UserRepository.deleteStudent(studentId);
    }
    /**
     * Bulk update student statuses
     */
    static async bulkUpdateStudents(studentIds, action, notes, updates) {
        if (!studentIds || studentIds.length === 0) {
            const err = new Error('No students selected for bulk operation.');
            err.statusCode = 400;
            err.code = 'VALIDATION_ERROR';
            throw err;
        }
        const results = [];
        for (const id of studentIds) {
            if (updates) {
                if (updates.user_status) {
                    await userRepository_1.UserRepository.updateUser(id, { status: updates.user_status });
                }
                if (updates.verification_status) {
                    await userRepository_1.UserRepository.updateStudentProfile(id, {
                        verification_status: updates.verification_status,
                        verification_notes: notes || `Bulk updated: ${updates.verification_status}`,
                        ...(updates.verification_status === 'VERIFIED' ? { verified_at: new Date().toISOString() } : {}),
                    });
                }
            }
            else if (action === 'VERIFY') {
                await userRepository_1.UserRepository.updateStudentProfile(id, {
                    verification_status: 'VERIFIED',
                    verification_notes: notes || 'Bulk verified by Administrator',
                    verified_at: new Date().toISOString(),
                });
            }
            else if (action === 'REJECT') {
                await userRepository_1.UserRepository.updateStudentProfile(id, {
                    verification_status: 'REJECTED',
                    verification_notes: notes || 'Bulk rejected by Administrator',
                });
            }
            else if (action === 'SUSPEND') {
                await userRepository_1.UserRepository.updateUser(id, { status: 'SUSPENDED' });
                await userRepository_1.UserRepository.updateStudentProfile(id, {
                    verification_status: 'SUSPENDED',
                    verification_notes: notes || 'Account suspended by Administrator',
                });
            }
            else if (action === 'ACTIVATE') {
                await userRepository_1.UserRepository.updateUser(id, { status: 'ACTIVE' });
            }
            results.push(id);
        }
        return { processedCount: results.length, studentIds: results };
    }
    /**
     * Create a new driver account in Supabase
     */
    static async createDriver(data) {
        const existing = await userRepository_1.UserRepository.findByEmailOrPhone(data.email);
        if (existing) {
            const err = new Error('An account with this email/phone already exists.');
            err.statusCode = 409;
            err.code = 'USER_EXISTS';
            throw err;
        }
        let collegeId = data.college_id;
        if (!collegeId) {
            const colleges = await collegeRepository_1.CollegeRepository.findAll();
            if (colleges.length > 0) {
                collegeId = colleges[0].id;
            }
        }
        const pwHash = await (0, crypto_1.hashPassword)(data.password);
        const user = await userRepository_1.UserRepository.createUser({
            email: data.email.toLowerCase(),
            phone: data.phone,
            full_name: data.full_name,
            password_hash: pwHash,
            role: 'DRIVER',
            status: 'ACTIVE',
        });
        const profile = await userRepository_1.UserRepository.createDriverProfile({
            id: user.id,
            college_id: collegeId,
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
    static async updateDriver(driverId, data) {
        const userUpdates = {};
        if (data.full_name)
            userUpdates.full_name = data.full_name;
        if (data.phone)
            userUpdates.phone = data.phone;
        if (Object.keys(userUpdates).length > 0) {
            await userRepository_1.UserRepository.updateUser(driverId, userUpdates);
        }
        const profileUpdates = {};
        if (data.college_id)
            profileUpdates.college_id = data.college_id;
        if (data.license_number)
            profileUpdates.license_number = data.license_number;
        if (data.license_expiry)
            profileUpdates.license_expiry = data.license_expiry;
        if (data.experience_years !== undefined)
            profileUpdates.experience_years = data.experience_years;
        if (data.aadhar_number !== undefined)
            profileUpdates.aadhar_number = data.aadhar_number;
        if (data.status)
            profileUpdates.status = data.status;
        if (Object.keys(profileUpdates).length > 0) {
            await userRepository_1.UserRepository.updateDriverProfile(driverId, profileUpdates);
        }
        return userRepository_1.UserRepository.getDriverProfile(driverId);
    }
    /**
     * Delete driver safely
     */
    static async deleteDriver(driverId) {
        return userRepository_1.UserRepository.deleteDriver(driverId);
    }
    /**
     * Update vehicle in Supabase
     */
    static async updateVehicle(vehicleId, updates) {
        return vehicleRepository_1.VehicleRepository.update(vehicleId, updates);
    }
    /**
     * Delete vehicle safely
     */
    static async deleteVehicle(vehicleId) {
        return vehicleRepository_1.VehicleRepository.delete(vehicleId);
    }
    /**
     * Update route and stop sequence in Supabase
     */
    static async updateRoute(routeId, updates, stops) {
        return routeRepository_1.RouteRepository.update(routeId, updates, stops);
    }
    /**
     * Delete route safely
     */
    static async deleteRoute(routeId) {
        return routeRepository_1.RouteRepository.delete(routeId);
    }
    /**
     * Centralized Assignment Matrix Overview
     */
    static async getAssignmentsSummary() {
        const supabase = (0, supabaseClient_1.getSupabaseClient)();
        // 1. Fetch routes with assigned vehicles & drivers
        const routes = await routeRepository_1.RouteRepository.findAll();
        // 2. Fetch all active vehicles
        const vehicles = await vehicleRepository_1.VehicleRepository.findAll();
        // 3. Fetch all active drivers
        const drivers = await userRepository_1.UserRepository.getAllDrivers();
        // 4. Fetch subscription and booking allocations per route
        const { data: routeBookings } = await supabase
            .from('bookings')
            .select('route_id, status')
            .eq('status', 'CONFIRMED');
        const bookingCounts = {};
        (routeBookings || []).forEach((b) => {
            bookingCounts[b.route_id] = (bookingCounts[b.route_id] || 0) + 1;
        });
        const routeAssignments = routes.map((r) => {
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
    static async allocateRouteResources(routeId, data) {
        const route = await routeRepository_1.RouteRepository.findById(routeId);
        if (!route) {
            const err = new Error('Route not found.');
            err.statusCode = 404;
            err.code = 'NOT_FOUND';
            throw err;
        }
        // Validate Vehicle if provided
        if (data.default_vehicle_id) {
            const vehicle = await vehicleRepository_1.VehicleRepository.findById(data.default_vehicle_id);
            if (!vehicle) {
                const err = new Error('Selected vehicle not found.');
                err.statusCode = 404;
                err.code = 'NOT_FOUND';
                throw err;
            }
            if (vehicle.status !== 'ACTIVE') {
                const err = new Error(`Cannot assign vehicle in ${vehicle.status} status. Vehicle must be ACTIVE.`);
                err.statusCode = 400;
                err.code = 'VALIDATION_ERROR';
                throw err;
            }
        }
        // Validate Driver if provided
        if (data.default_driver_id) {
            const driver = await userRepository_1.UserRepository.getDriverProfile(data.default_driver_id);
            if (!driver) {
                const err = new Error('Selected driver not found.');
                err.statusCode = 404;
                err.code = 'NOT_FOUND';
                throw err;
            }
            if (driver.status !== 'ACTIVE') {
                const err = new Error(`Cannot assign driver with status ${driver.status}. Driver must be ACTIVE and not on leave.`);
                err.statusCode = 400;
                err.code = 'VALIDATION_ERROR';
                throw err;
            }
        }
        const updated = await routeRepository_1.RouteRepository.update(routeId, {
            default_vehicle_id: data.default_vehicle_id !== undefined ? data.default_vehicle_id : route.default_vehicle_id,
            default_driver_id: data.default_driver_id !== undefined ? data.default_driver_id : route.default_driver_id,
        });
        return updated;
    }
    /**
     * Create a new admin account (User + Admin Profile) in Supabase
     */
    static async createAdmin(data) {
        const existing = await userRepository_1.UserRepository.findByEmailOrPhone(data.email);
        if (existing) {
            const err = new Error('An account with this email/phone already exists.');
            err.statusCode = 409;
            err.code = 'USER_EXISTS';
            throw err;
        }
        const pwHash = await (0, crypto_1.hashPassword)(data.password);
        const user = await userRepository_1.UserRepository.createUser({
            email: data.email.toLowerCase(),
            phone: data.phone,
            full_name: data.full_name,
            password_hash: pwHash,
            role: 'ADMIN',
            status: 'ACTIVE',
        });
        const profile = await userRepository_1.UserRepository.createAdminProfile({
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
    static async createOrUpdateAdminProfile(userId, data) {
        const user = await userRepository_1.UserRepository.findById(userId);
        if (!user) {
            const err = new Error('User not found.');
            err.statusCode = 404;
            err.code = 'USER_NOT_FOUND';
            throw err;
        }
        if (user.role !== 'ADMIN') {
            await userRepository_1.UserRepository.updateUser(userId, { role: 'ADMIN' });
        }
        const fullName = data.full_name || user.full_name;
        const profile = await userRepository_1.UserRepository.upsertAdminProfile({
            id: userId,
            full_name: fullName,
            department: data.department || 'Operations',
            permissions: data.permissions || ['ALL'],
        });
        return profile;
    }
}
exports.AdminService = AdminService;
//# sourceMappingURL=adminService.js.map