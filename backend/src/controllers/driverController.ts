import { Request, Response, NextFunction } from 'express';
import { DriverService } from '../services/driverService';
import { sendSuccess } from '../utils/response';

export class DriverController {
  public static async getDashboard(req: Request, res: Response, next: NextFunction) {
    try {
      const driverId = req.user!.userId;
      const data = await DriverService.getDriverDashboard(driverId);
      sendSuccess(res, 'Driver dashboard retrieved.', data);
    } catch (err) {
      next(err);
    }
  }

  public static async getManifest(req: Request, res: Response, next: NextFunction) {
    try {
      const driverId = req.user!.userId;
      const tripId = req.params.tripId;
      const manifest = await DriverService.getTripManifest(tripId, driverId);
      sendSuccess(res, 'Trip manifest retrieved.', manifest);
    } catch (err) {
      next(err);
    }
  }

  public static async startTrip(req: Request, res: Response, next: NextFunction) {
    try {
      const driverId = req.user!.userId;
      const tripId = req.params.tripId;
      const trip = await DriverService.startTrip(tripId, driverId);
      sendSuccess(res, 'Trip started successfully.', trip);
    } catch (err) {
      next(err);
    }
  }

  public static async endTrip(req: Request, res: Response, next: NextFunction) {
    try {
      const driverId = req.user!.userId;
      const tripId = req.params.tripId;
      const trip = await DriverService.endTrip(tripId, driverId);
      sendSuccess(res, 'Trip ended successfully.', trip);
    } catch (err) {
      next(err);
    }
  }
}
