import { Request, Response, NextFunction } from 'express';
export declare class PlanController {
    static getPlans(req: Request, res: Response, next: NextFunction): Promise<void>;
    static createPlan(req: Request, res: Response, next: NextFunction): Promise<void>;
    static updatePlan(req: Request, res: Response, next: NextFunction): Promise<void>;
    static deletePlan(req: Request, res: Response, next: NextFunction): Promise<void>;
}
