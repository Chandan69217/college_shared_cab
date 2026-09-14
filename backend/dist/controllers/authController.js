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
    static async verifyOtp(req, res, next) {
        try {
            const validated = schemas_1.verifyOtpSchema.parse(req.body);
            const result = await authService_1.AuthService.verifyOtp(validated.phone, validated.otp);
            (0, response_1.sendSuccess)(res, 'OTP verified successfully.', result);
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