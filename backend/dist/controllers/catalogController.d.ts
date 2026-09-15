import { Request, Response, NextFunction } from 'express';
export declare class CatalogController {
    static getColleges(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    static lookupCollege(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    static createCollege(req: Request, res: Response, next: NextFunction): Promise<void>;
    static updateCollege(req: Request, res: Response, next: NextFunction): Promise<void>;
    static deleteCollege(req: Request, res: Response, next: NextFunction): Promise<void>;
    static getPickupPoints(req: Request, res: Response, next: NextFunction): Promise<void>;
    static createPickupPoint(req: Request, res: Response, next: NextFunction): Promise<void>;
    static updatePickupPoint(req: Request, res: Response, next: NextFunction): Promise<void>;
    static deletePickupPoint(req: Request, res: Response, next: NextFunction): Promise<void>;
    static getRoutes(req: Request, res: Response, next: NextFunction): Promise<void>;
    static createRoute(req: Request, res: Response, next: NextFunction): Promise<void>;
    static getVehicles(req: Request, res: Response, next: NextFunction): Promise<void>;
    static createVehicle(req: Request, res: Response, next: NextFunction): Promise<void>;
}
