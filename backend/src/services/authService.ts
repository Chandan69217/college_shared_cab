import jwt from 'jsonwebtoken';
import { db } from '../database/db';
import { ENV } from '../config/env';
import { AuthTokenPayload, User, UserRole } from '../types';
import { comparePassword, hashPassword } from '../utils/crypto';

export class AuthService {
  /**
   * Register a new student
   */
  public static async registerStudent(data: {
    email: string;
    phone: string;
    full_name: string;
    password: string;
    college_id: string;
    student_id_number: string;
    roll_number?: string;
    course: string;
    semester: number;
    id_card_url?: string;
  }): Promise<{ user: User; token: string }> {
    // Check if user already exists
    for (const user of db.users.values()) {
      if (user.email.toLowerCase() === data.email.toLowerCase()) {
        const err: any = new Error('An account with this email already exists.');
        err.statusCode = 409;
        err.code = 'EMAIL_EXISTS';
        throw err;
      }
      if (user.phone === data.phone) {
        const err: any = new Error('An account with this phone number already exists.');
        err.statusCode = 409;
        err.code = 'PHONE_EXISTS';
        throw err;
      }
    }

    const college = db.colleges.get(data.college_id);
    if (!college) {
      const err: any = new Error('Invalid college ID.');
      err.statusCode = 400;
      err.code = 'COLLEGE_NOT_FOUND';
      throw err;
    }

    const userId = `stu-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();
    const passwordHash = await hashPassword(data.password);

    const newUser: User = {
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

    db.users.set(userId, newUser);

    db.studentProfiles.set(userId, {
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
  public static async login(
    emailOrPhone: string,
    plainPassword: string,
    expectedRole?: UserRole
  ): Promise<{ user: User; profile: any; token: string }> {
    let matchedUser: User | undefined;

    const normalizedInput = emailOrPhone.trim().toLowerCase();
    for (const u of db.users.values()) {
      if (u.email.toLowerCase() === normalizedInput || u.phone === emailOrPhone.trim()) {
        matchedUser = u;
        break;
      }
    }

    if (!matchedUser) {
      const err: any = new Error('Invalid email/phone or password.');
      err.statusCode = 401;
      err.code = 'INVALID_CREDENTIALS';
      throw err;
    }

    // Role check if specified
    if (expectedRole && matchedUser.role !== expectedRole) {
      const err: any = new Error(`Account is not registered as a ${expectedRole}.`);
      err.statusCode = 403;
      err.code = 'ROLE_MISMATCH';
      throw err;
    }

    // Check account status
    if (matchedUser.status === 'SUSPENDED' || matchedUser.status === 'DEACTIVATED') {
      const err: any = new Error(`Account is ${matchedUser.status.toLowerCase()}. Please contact administration.`);
      err.statusCode = 403;
      err.code = 'ACCOUNT_LOCKED';
      throw err;
    }

    // For demo convenience, also allow standard demo password 'password123' directly
    let isMatch = plainPassword === 'password123';
    if (!isMatch) {
      isMatch = await comparePassword(plainPassword, matchedUser.password_hash);
    }

    if (!isMatch) {
      const err: any = new Error('Invalid email/phone or password.');
      err.statusCode = 401;
      err.code = 'INVALID_CREDENTIALS';
      throw err;
    }

    let profile: any = null;
    if (matchedUser.role === 'STUDENT') {
      profile = db.studentProfiles.get(matchedUser.id);
    } else if (matchedUser.role === 'DRIVER') {
      profile = db.driverProfiles.get(matchedUser.id);
    } else if (matchedUser.role === 'ADMIN') {
      profile = db.adminProfiles.get(matchedUser.id);
    }

    const token = this.generateToken(matchedUser);
    return { user: matchedUser, profile, token };
  }

  /**
   * Request OTP for student mobile login
   */
  public static async requestOtp(phone: string): Promise<{ message: string; demoOtp?: string }> {
    // In production, send via SMS gateway. For demo/dev, return standard '123456'
    return {
      message: 'OTP sent successfully to ' + phone,
      demoOtp: '123456',
    };
  }

  /**
   * Verify OTP and log in student
   */
  public static async verifyOtp(
    phone: string,
    otp: string
  ): Promise<{ user: User; profile: any; token: string }> {
    if (otp !== '123456') {
      const err: any = new Error('Invalid or expired OTP.');
      err.statusCode = 400;
      err.code = 'INVALID_OTP';
      throw err;
    }

    let matchedUser: User | undefined;
    for (const u of db.users.values()) {
      if (u.phone === phone.trim()) {
        matchedUser = u;
        break;
      }
    }

    if (!matchedUser) {
      const err: any = new Error('No account found with this phone number. Please register first.');
      err.statusCode = 404;
      err.code = 'USER_NOT_FOUND';
      throw err;
    }

    const profile = db.studentProfiles.get(matchedUser.id);
    const token = this.generateToken(matchedUser);

    return { user: matchedUser, profile, token };
  }

  /**
   * Get current authenticated user details
   */
  public static async getCurrentUser(userId: string): Promise<{ user: User; profile: any }> {
    const user = db.users.get(userId);
    if (!user) {
      const err: any = new Error('User not found.');
      err.statusCode = 404;
      err.code = 'USER_NOT_FOUND';
      throw err;
    }

    let profile: any = null;
    if (user.role === 'STUDENT') {
      profile = db.studentProfiles.get(user.id);
    } else if (user.role === 'DRIVER') {
      profile = db.driverProfiles.get(user.id);
    } else if (user.role === 'ADMIN') {
      profile = db.adminProfiles.get(user.id);
    }

    return { user, profile };
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
