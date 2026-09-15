import { Request, Response, NextFunction } from 'express';
export declare class AdminController {
    static getDashboardStats(req: Request, res: Response, next: NextFunction): Promise<void>;
    static getStudents(req: Request, res: Response, next: NextFunction): Promise<void>;
    static verifyStudent(req: Request, res: Response, next: NextFunction): Promise<void>;
    static getDrivers(req: Request, res: Response, next: NextFunction): Promise<void>;
    static createDriver(req: Request, res: Response, next: NextFunction): Promise<void>;
    static getAdmins(req: Request, res: Response, next: NextFunction): Promise<void>;
    static createAdmin(req: Request, res: Response, next: NextFunction): Promise<void>;
    static createAdminProfile(req: Request, res: Response, next: NextFunction): Promise<void>;
    static getAdminProfile(req: Request, res: Response, next: NextFunction): Promise<void>;
    static updateAdminProfile(req: Request, res: Response, next: NextFunction): Promise<void>;
    static createStudent(req: Request, res: Response, next: NextFunction): Promise<void>;
    static updateStudent(req: Request, res: Response, next: NextFunction): Promise<void>;
    static deleteStudent(req: Request, res: Response, next: NextFunction): Promise<void>;
    static bulkUpdateStudents(req: Request, res: Response, next: NextFunction): Promise<void>;
    static updateDriver(req: Request, res: Response, next: NextFunction): Promise<void>;
    static deleteDriver(req: Request, res: Response, next: NextFunction): Promise<void>;
    static updateVehicle(req: Request, res: Response, next: NextFunction): Promise<void>;
    static deleteVehicle(req: Request, res: Response, next: NextFunction): Promise<void>;
    static updateRoute(req: Request, res: Response, next: NextFunction): Promise<void>;
    static deleteRoute(req: Request, res: Response, next: NextFunction): Promise<void>;
    static getAssignments(req: Request, res: Response, next: NextFunction): Promise<void>;
    static allocateRouteResources(req: Request, res: Response, next: NextFunction): Promise<void>;
    static getSubscriptions(req: Request, res: Response, next: NextFunction): Promise<void>;
    static getAuditLogs(req: Request, res: Response, next: NextFunction): Promise<void>;
}
