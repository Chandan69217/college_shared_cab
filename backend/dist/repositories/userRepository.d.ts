import { User, StudentProfile, DriverProfile, AdminProfile } from '../types';
export declare class UserRepository {
    private static getClient;
    static findByEmailOrPhone(emailOrPhone: string): Promise<User | null>;
    static findById(id: string): Promise<User | null>;
    static createUser(user: Partial<User>): Promise<User>;
    static updateUser(id: string, updates: Partial<User>): Promise<User>;
    static getStudentProfile(userId: string): Promise<StudentProfile | null>;
    static createStudentProfile(profile: Partial<StudentProfile>): Promise<StudentProfile>;
    static updateStudentProfile(userId: string, updates: Partial<StudentProfile>): Promise<StudentProfile>;
    static getDriverProfile(userId: string): Promise<DriverProfile | null>;
    static createDriverProfile(profile: Partial<DriverProfile>): Promise<DriverProfile>;
    static updateDriverProfile(userId: string, updates: Partial<DriverProfile>): Promise<DriverProfile>;
    static getAdminProfile(userId: string): Promise<AdminProfile | null>;
    static createAdminProfile(profile: Partial<AdminProfile>): Promise<AdminProfile>;
    static updateAdminProfile(userId: string, updates: Partial<AdminProfile>): Promise<AdminProfile>;
    static upsertAdminProfile(profile: Partial<AdminProfile>): Promise<AdminProfile>;
    static getAllAdmins(): Promise<any[]>;
    static getAllStudents(collegeId?: string): Promise<any[]>;
    static getAllDrivers(collegeId?: string): Promise<any[]>;
    static deleteStudent(userId: string): Promise<void>;
    static deleteDriver(userId: string): Promise<void>;
}
