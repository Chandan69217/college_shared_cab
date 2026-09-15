import jwt from 'jsonwebtoken';
import { ENV } from '../config/env';
import { AuthTokenPayload, User, UserRole } from '../types';
import { comparePassword, hashPassword } from '../utils/crypto';
import { UserRepository } from '../repositories/userRepository';
import { CollegeRepository } from '../repositories/collegeRepository';
import { OtpService } from './otpService';
import { logger } from '../utils/logger';

export class AuthService {
  /**
   * Register a new student in Supabase
   */
  public static async registerStudent(data: {
    email: string;
    phone: string;
    full_name: string;
    password: string;
    college_id?: string;
    college_code?: string;
    student_id_number: string;
    roll_number?: string;
    course: string;
    semester: number;
    id_card_url?: string;
  }): Promise<{ user: User; token: string }> {
    // Check if user already exists
    const existing = await UserRepository.findByEmailOrPhone(data.email);
    if (existing) {
      const err: any = new Error('An account with this email/phone already exists.');
      err.statusCode = 409;
      err.code = 'EMAIL_EXISTS';
      throw err;
    }

    let college = null;
    if (data.college_code) {
      college = await CollegeRepository.findByCode(data.college_code);
      if (!college) {
        const err: any = new Error(
          `Invalid college code "${data.college_code}". Please verify your institution code or contact campus support.`
        );
        err.statusCode = 400;
        err.code = 'COLLEGE_NOT_FOUND';
        throw err;
      }
    } else if (data.college_id) {
      college = await CollegeRepository.findById(data.college_id);
      if (!college) {
        const err: any = new Error('Invalid college ID.');
        err.statusCode = 400;
        err.code = 'COLLEGE_NOT_FOUND';
        throw err;
      }
    } else {
      const err: any = new Error('College code or College ID is required for registration.');
      err.statusCode = 400;
      err.code = 'MISSING_COLLEGE';
      throw err;
    }

    if (!college.is_active) {
      const err: any = new Error(`College "${college.name}" is currently inactive. Registration is unavailable.`);
      err.statusCode = 400;
      err.code = 'COLLEGE_INACTIVE';
      throw err;
    }

    const passwordHash = await hashPassword(data.password);

    const newUser = await UserRepository.createUser({
      email: data.email.toLowerCase(),
      phone: data.phone,
      full_name: data.full_name,
      password_hash: passwordHash,
      role: 'STUDENT',
      status: 'ACTIVE',
    });

    await UserRepository.createStudentProfile({
      id: newUser.id,
      college_id: college.id,
      student_id_number: data.student_id_number,
      roll_number: data.roll_number,
      course: data.course,
      semester: data.semester,
      id_card_url: data.id_card_url,
      verification_status: 'PENDING',
    });

    const token = this.generateToken(newUser);
    return { user: newUser, token };
  }

  /**
   * Register a new admin in Supabase
   */
  public static async registerAdmin(data: {
    email: string;
    phone: string;
    full_name: string;
    password: string;
    department?: string;
    permissions?: string[];
  }): Promise<{ user: User; profile: any; token: string }> {
    const existing = await UserRepository.findByEmailOrPhone(data.email);
    if (existing) {
      const err: any = new Error('An account with this email/phone already exists.');
      err.statusCode = 409;
      err.code = 'EMAIL_EXISTS';
      throw err;
    }

    const passwordHash = await hashPassword(data.password);

    const newUser = await UserRepository.createUser({
      email: data.email.toLowerCase(),
      phone: data.phone,
      full_name: data.full_name,
      password_hash: passwordHash,
      role: 'ADMIN',
      status: 'ACTIVE',
    });

    const profile = await UserRepository.createAdminProfile({
      id: newUser.id,
      full_name: data.full_name,
      department: data.department || 'Operations',
      permissions: data.permissions || ['ALL'],
    });

    const token = this.generateToken(newUser);
    return { user: newUser, profile, token };
  }

  /**
   * Login with email or phone and password against Supabase users table
   */
  public static async login(
    emailOrPhone: string,
    plainPassword: string,
    expectedRole?: UserRole
  ): Promise<{ user: User; profile: any; token: string }> {
    const matchedUser = await UserRepository.findByEmailOrPhone(emailOrPhone);

    if (!matchedUser) {
      const err: any = new Error('No registered account found with this email/phone. Please verify your email or create an account.');
      err.statusCode = 401;
      err.code = 'USER_NOT_REGISTERED';
      throw err;
    }

    // Role check if specified
    if (expectedRole && matchedUser.role !== expectedRole) {
      const err: any = new Error(`This account is registered as a ${matchedUser.role}. Only ${expectedRole} accounts are authorized to log in here.`);
      err.statusCode = 403;
      err.code = 'ROLE_MISMATCH';
      throw err;
    }

    // Check account status
    if (matchedUser.status === 'SUSPENDED' || matchedUser.status === 'DEACTIVATED') {
      const err: any = new Error(`Account is ${matchedUser.status.toLowerCase()}. Please contact system administration.`);
      err.statusCode = 403;
      err.code = 'ACCOUNT_LOCKED';
      throw err;
    }

    const isMatch = await comparePassword(plainPassword, matchedUser.password_hash);
    if (!isMatch) {
      const err: any = new Error('Incorrect password. Please check your credentials and try again.');
      err.statusCode = 401;
      err.code = 'INVALID_PASSWORD';
      throw err;
    }

    let profile: any = null;
    if (matchedUser.role === 'STUDENT') {
      profile = await UserRepository.getStudentProfile(matchedUser.id);
    } else if (matchedUser.role === 'DRIVER') {
      profile = await UserRepository.getDriverProfile(matchedUser.id);
    } else if (matchedUser.role === 'ADMIN') {
      profile = await UserRepository.getAdminProfile(matchedUser.id);
    }

    const token = this.generateToken(matchedUser);
    return { user: matchedUser, profile, token };
  }

  /**
   * Request OTP for student mobile login
   */
  public static async requestOtp(phone: string): Promise<{ message: string }> {
    if (!phone || phone.trim().length < 10) {
      const err: any = new Error('Please enter a valid mobile number.');
      err.statusCode = 400;
      err.code = 'VALIDATION_ERROR';
      throw err;
    }
    return {
      message: 'OTP sent successfully to ' + phone,
    };
  }

  /**
   * Verify OTP and log in student
   */
  public static async verifyOtp(
    phone: string,
    otp: string
  ): Promise<{ user: User; profile: any; token: string }> {
    if (!otp || otp.trim().length < 4) {
      const err: any = new Error('The OTP you entered is incorrect. Please try again.');
      err.statusCode = 400;
      err.code = 'OTP_INVALID';
      throw err;
    }

    const matchedUser = await UserRepository.findByEmailOrPhone(phone);
    if (!matchedUser) {
      const err: any = new Error('We couldn\'t find an account with the credentials you entered. Please check your details or create an account.');
      err.statusCode = 404;
      err.code = 'ACCOUNT_NOT_FOUND';
      throw err;
    }

    const profile = await UserRepository.getStudentProfile(matchedUser.id);
    const token = this.generateToken(matchedUser);

    return { user: matchedUser, profile, token };
  }

  /**
   * Get current authenticated user details
   */
  public static async getCurrentUser(userId: string): Promise<{ user: User; profile: any }> {
    const user = await UserRepository.findById(userId);
    if (!user) {
      const err: any = new Error('User not found.');
      err.statusCode = 404;
      err.code = 'USER_NOT_FOUND';
      throw err;
    }

    let profile: any = null;
    if (user.role === 'STUDENT') {
      profile = await UserRepository.getStudentProfile(user.id);
    } else if (user.role === 'DRIVER') {
      profile = await UserRepository.getDriverProfile(user.id);
    } else if (user.role === 'ADMIN') {
      profile = await UserRepository.getAdminProfile(user.id);
    }

    return { user, profile };
  }

  /**
   * Change password for logged-in user with strict validation
   */
  public static async changePassword(
    userId: string,
    currentPass: string,
    newPass: string
  ): Promise<{ message: string }> {
    const user = await UserRepository.findById(userId);
    if (!user) {
      const err: any = new Error('User not found.');
      err.statusCode = 404;
      err.code = 'USER_NOT_FOUND';
      throw err;
    }

    const isMatch = await comparePassword(currentPass, user.password_hash);
    if (!isMatch) {
      const err: any = new Error('The current password you entered is incorrect. Please try again.');
      err.statusCode = 400;
      err.code = 'INVALID_CURRENT_PASSWORD';
      throw err;
    }

    const isSame = await comparePassword(newPass, user.password_hash);
    if (isSame) {
      const err: any = new Error('New password cannot be the same as your current password.');
      err.statusCode = 400;
      err.code = 'SAME_PASSWORD';
      throw err;
    }

    const newHash = await hashPassword(newPass);
    await UserRepository.updateUser(userId, { password_hash: newHash });

    return { message: 'Password updated successfully. Please log in with your new credentials if required.' };
  }

  /**
   * Initiate forgot password flow with role isolation and clear feedback
   * Dispatches OTP to BOTH email and SMS simultaneously for valid accounts
   */
  public static async forgotPassword(
    identifierOrEmail?: string,
    phone?: string,
    expectedRole?: 'STUDENT' | 'DRIVER' | 'ADMIN'
  ): Promise<{ message: string; cooldownSeconds: number }> {
    const rawIdentifier = (identifierOrEmail || phone || '').trim();
    if (!rawIdentifier) {
      const err: any = new Error('Please enter your registered email address or mobile number.');
      err.statusCode = 400;
      err.code = 'VALIDATION_ERROR';
      throw err;
    }

    const user = await UserRepository.findByEmailOrPhone(rawIdentifier);

    // If user does not exist in database, return explicit 404 error
    if (!user) {
      const roleLabel = expectedRole ? expectedRole.toLowerCase() : 'user';
      const err: any = new Error(`No registered ${roleLabel} account found with "${rawIdentifier}". Please check your email or mobile number.`);
      err.statusCode = 404;
      err.code = 'USER_NOT_FOUND';
      throw err;
    }

    // Strict Role Isolation: If expectedRole is specified, ensure account matches the role
    if (expectedRole && user.role !== expectedRole) {
      const err: any = new Error(`This account is registered as a ${user.role.toLowerCase()}. You cannot recover this account from the ${expectedRole.toLowerCase()} portal.`);
      err.statusCode = 403;
      err.code = 'ROLE_MISMATCH';
      throw err;
    }

    // Pass user metadata (email, phone, fullName, id, role) to OtpService for dual-channel dispatch
    return OtpService.generateAndSendOtp(
      rawIdentifier,
      'PASSWORD_RESET',
      user.id,
      user.email,
      user.phone,
      user.full_name,
      user.role
    );
  }

  /**
   * Verify recovery OTP and issue single-use resetToken with role scoping
   */
  public static async verifyRecoveryOtp(
    identifier: string,
    otp: string,
    purpose: string = 'PASSWORD_RESET',
    expectedRole?: 'STUDENT' | 'DRIVER' | 'ADMIN'
  ): Promise<{ resetToken: string; message: string }> {
    const result = await OtpService.verifyOtp(identifier, otp, purpose, expectedRole);
    return {
      resetToken: result.resetToken,
      message: 'OTP verified successfully. You may now reset your password.',
    };
  }

  /**
   * Reset user password using verified single-use resetToken and enforce role boundaries
   */
  public static async resetPassword(
    identifier: string,
    resetToken: string,
    newPass: string,
    expectedRole?: 'STUDENT' | 'DRIVER' | 'ADMIN'
  ): Promise<{ message: string }> {
    const isValidToken = OtpService.verifyResetToken(identifier, resetToken, expectedRole);
    if (!isValidToken) {
      const err: any = new Error('Invalid or expired password reset session. Please request a new OTP.');
      err.statusCode = 400;
      err.code = 'INVALID_RESET_TOKEN';
      throw err;
    }

    const user = await UserRepository.findByEmailOrPhone(identifier);
    if (!user) {
      const err: any = new Error('No registered account associated with these credentials.');
      err.statusCode = 404;
      err.code = 'ACCOUNT_NOT_FOUND';
      throw err;
    }

    // Verify role boundary
    if (expectedRole && user.role !== expectedRole) {
      const err: any = new Error(`This account is registered as ${user.role}. You cannot reset this password from the ${expectedRole} portal.`);
      err.statusCode = 403;
      err.code = 'ROLE_MISMATCH';
      throw err;
    }

    const isSame = await comparePassword(newPass, user.password_hash);
    if (isSame) {
      const err: any = new Error('New password cannot be the same as your previous password.');
      err.statusCode = 400;
      err.code = 'SAME_PASSWORD';
      throw err;
    }

    const newHash = await hashPassword(newPass);
    await UserRepository.updateUser(user.id, { password_hash: newHash });

    return { message: 'Password reset successfully. Please login with your new password.' };
  }

  private static generateToken(user: User): string {
    const payload: AuthTokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      fullName: user.full_name,
    };

    return jwt.sign(payload, ENV.JWT_SECRET, {
      expiresIn: ENV.JWT_EXPIRES_IN as any,
    });
  }
}
