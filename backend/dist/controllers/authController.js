"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const authService_1 = require("../services/authService");
const schemas_1 = require("../validators/schemas");
const response_1 = require("../utils/response");
class AuthController {
    static async registerStudent(req, res, next) {
        try {
            const validated = schemas_1.registerStudentSchema.parse(req.body);
            const result = await authService_1.AuthService.registerStudent(validated);
            (0, response_1.sendSuccess)(res, 'Student registration successful.', result, 201);
        }
        catch (err) {
            next(err);
        }
    }
    static async registerAdmin(req, res, next) {
        try {
            const validated = schemas_1.createAdminSchema.parse(req.body);
            const result = await authService_1.AuthService.registerAdmin(validated);
            (0, response_1.sendSuccess)(res, 'Admin registration successful.', result, 201);
        }
        catch (err) {
            next(err);
        }
    }
    static async login(req, res, next) {
        try {
            const validated = schemas_1.loginSchema.parse(req.body);
            const result = await authService_1.AuthService.login(validated.emailOrPhone, validated.password, validated.role);
            (0, response_1.sendSuccess)(res, 'Login successful.', result);
        }
        catch (err) {
            next(err);
        }
    }
    static async changePassword(req, res, next) {
        try {
            const userId = req.user.userId;
            const validated = schemas_1.changePasswordSchema.parse(req.body);
            const result = await authService_1.AuthService.changePassword(userId, validated.currentPassword, validated.newPassword);
            (0, response_1.sendSuccess)(res, result.message, null);
        }
        catch (err) {
            next(err);
        }
    }
    static async forgotPassword(req, res, next) {
        try {
            const validated = schemas_1.forgotPasswordSchema.parse(req.body);
            const identifier = validated.identifier || validated.emailOrPhone || validated.email || validated.phone;
            const result = await authService_1.AuthService.forgotPassword(identifier, undefined, validated.role);
            (0, response_1.sendSuccess)(res, result.message, { cooldownSeconds: result.cooldownSeconds });
        }
        catch (err) {
            next(err);
        }
    }
    static async verifyOtp(req, res, next) {
        try {
            const validated = schemas_1.verifyRecoveryOtpSchema.parse(req.body);
            const identifier = (validated.identifier || validated.emailOrPhone);
            const result = await authService_1.AuthService.verifyRecoveryOtp(identifier, validated.otp, validated.purpose, validated.role);
            (0, response_1.sendSuccess)(res, result.message, { resetToken: result.resetToken });
        }
        catch (err) {
            next(err);
        }
    }
    static async resetPassword(req, res, next) {
        try {
            const validated = schemas_1.resetPasswordSchema.parse(req.body);
            const identifier = (validated.identifier || validated.emailOrPhone);
            const result = await authService_1.AuthService.resetPassword(identifier, validated.resetToken, validated.newPassword, validated.role);
            (0, response_1.sendSuccess)(res, result.message, null);
        }
        catch (err) {
            next(err);
        }
    }
    static async requestOtp(req, res, next) {
        try {
            const validated = schemas_1.requestOtpSchema.parse(req.body);
            const result = await authService_1.AuthService.requestOtp(validated.phone);
            (0, response_1.sendSuccess)(res, result.message, result);
        }
        catch (err) {
            next(err);
        }
    }
    static async me(req, res, next) {
        try {
            const userId = req.user.userId;
            const result = await authService_1.AuthService.getCurrentUser(userId);
            (0, response_1.sendSuccess)(res, 'Profile retrieved successfully.', result);
        }
        catch (err) {
            next(err);
        }
    }
}
exports.AuthController = AuthController;
//# sourceMappingURL=authController.js.map