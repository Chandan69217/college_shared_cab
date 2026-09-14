"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const db_1 = require("../database/db");
const env_1 = require("../config/env");
const crypto_1 = require("../utils/crypto");
class AuthService {
    /**
     * Register a new student
     */
    static async registerStudent(data) {
        // Check if user already exists
        for (const user of db_1.db.users.values()) {
            if (user.email.toLowerCase() === data.email.toLowerCase()) {
                const err = new Error('An account with this email already exists.');
                err.statusCode = 409;
                err.code = 'EMAIL_EXISTS';
                throw err;
            }
            if (user.phone === data.phone) {
                const err = new Error('An account with this phone number already exists.');
                err.statusCode = 409;
                err.code = 'PHONE_EXISTS';
                throw err;
            }
        }
        const college = db_1.db.colleges.get(data.college_id);
        if (!college) {
            const err = new Error('Invalid college ID.');
            err.statusCode = 400;
            err.code = 'COLLEGE_NOT_FOUND';
            throw err;
        }
        const userId = `stu-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
        const now = new Date().toISOString();
        const passwordHash = await (0, crypto_1.hashPassword)(data.password);
        const newUser = {
            id: userId,
            email: data.email.toLowerCase(),
            phone: data.phone,
            full_name: data.full_name,
            password_hash: passwordHash,
            role: 'STUDENT',
            status: 'ACTIVE',
            created_at: now,
            updated_at: now,
        };
        db_1.db.users.set(userId, newUser);
        db_1.db.studentProfiles.set(userId, {
            id: userId,
            college_id: data.college_id,
            student_id_number: data.student_id_number,
            roll_number: data.roll_number,
            course: data.course,
            semester: data.semester,
            id_card_url: data.id_card_url,
            verification_status: 'PENDING',
            created_at: now,
            updated_at: now,
        });
        const token = this.generateToken(newUser);
        return { user: newUser, token };
    }
    /**
     * Login with email or phone and password
     */
    static async login(emailOrPhone, plainPassword, expectedRole) {
        let matchedUser;
        const normalizedInput = emailOrPhone.trim().toLowerCase();
        for (const u of db_1.db.users.values()) {
            if (u.email.toLowerCase() === normalizedInput || u.phone === emailOrPhone.trim()) {
                matchedUser = u;
                break;
            }
        }
        if (!matchedUser) {
            const err = new Error('Invalid email/phone or password.');
            err.statusCode = 401;
            err.code = 'INVALID_CREDENTIALS';
            throw err;
        }
        // Role check if specified
        if (expectedRole && matchedUser.role !== expectedRole) {
            const err = new Error(`Account is not registered as a ${expectedRole}.`);
            err.statusCode = 403;
            err.code = 'ROLE_MISMATCH';
            throw err;
        }
        // Check account status
        if (matchedUser.status === 'SUSPENDED' || matchedUser.status === 'DEACTIVATED') {
            const err = new Error(`Account is ${matchedUser.status.toLowerCase()}. Please contact administration.`);
            err.statusCode = 403;
            err.code = 'ACCOUNT_LOCKED';
            throw err;
        }
        // For demo convenience, also allow standard demo password 'password123' directly
        let isMatch = plainPassword === 'password123';
        if (!isMatch) {
            isMatch = await (0, crypto_1.comparePassword)(plainPassword, matchedUser.password_hash);
        }
        if (!isMatch) {
            const err = new Error('Invalid email/phone or password.');
            err.statusCode = 401;
            err.code = 'INVALID_CREDENTIALS';
            throw err;
        }
        let profile = null;
        if (matchedUser.role === 'STUDENT') {
            profile = db_1.db.studentProfiles.get(matchedUser.id);
        }
        else if (matchedUser.role === 'DRIVER') {
            profile = db_1.db.driverProfiles.get(matchedUser.id);
        }
        else if (matchedUser.role === 'ADMIN') {
            profile = db_1.db.adminProfiles.get(matchedUser.id);
        }
        const token = this.generateToken(matchedUser);
        return { user: matchedUser, profile, token };
    }
    /**
     * Request OTP for student mobile login
     */
    static async requestOtp(phone) {
        // In production, send via SMS gateway. For demo/dev, return standard '123456'
        return {
            message: 'OTP sent successfully to ' + phone,
            demoOtp: '123456',
        };
    }
    /**
     * Verify OTP and log in student
     */
    static async verifyOtp(phone, otp) {
        if (otp !== '123456') {
            const err = new Error('Invalid or expired OTP.');
            err.statusCode = 400;
            err.code = 'INVALID_OTP';
            throw err;
        }
        let matchedUser;
        for (const u of db_1.db.users.values()) {
            if (u.phone === phone.trim()) {
                matchedUser = u;
                break;
            }
        }
        if (!matchedUser) {
            const err = new Error('No account found with this phone number. Please register first.');
            err.statusCode = 404;
            err.code = 'USER_NOT_FOUND';
            throw err;
        }
        const profile = db_1.db.studentProfiles.get(matchedUser.id);
        const token = this.generateToken(matchedUser);
        return { user: matchedUser, profile, token };
    }
    /**
     * Get current authenticated user details
     */
    static async getCurrentUser(userId) {
        const user = db_1.db.users.get(userId);
        if (!user) {
            const err = new Error('User not found.');
            err.statusCode = 404;
            err.code = 'USER_NOT_FOUND';
            throw err;
        }
        let profile = null;
        if (user.role === 'STUDENT') {
            profile = db_1.db.studentProfiles.get(user.id);
        }
        else if (user.role === 'DRIVER') {
            profile = db_1.db.driverProfiles.get(user.id);
        }
        else if (user.role === 'ADMIN') {
            profile = db_1.db.adminProfiles.get(user.id);
        }
        return { user, profile };
    }
    static generateToken(user) {
        const payload = {
            userId: user.id,
            email: user.email,
            role: user.role,
            fullName: user.full_name,
        };
        return jsonwebtoken_1.default.sign(payload, env_1.ENV.JWT_SECRET, {
            expiresIn: env_1.ENV.JWT_EXPIRES_IN,
        });
    }
}
exports.AuthService = AuthService;
//# sourceMappingURL=authService.js.map