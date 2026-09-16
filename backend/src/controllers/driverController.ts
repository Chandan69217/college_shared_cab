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

  public static async getScheduledTrips(req: Request, res: Response, next: NextFunction) {
    try {
      const driverId = req.user!.userId;
      const filter = (req.query.filter || req.query.tab || 'ALL') as string;
      const data = await DriverService.getScheduledTrips(driverId, filter);
      sendSuccess(res, 'Driver scheduled trips retrieved.', data);
    } catch (err) {
      next(err);
    }
  }

  public static async getTripDetails(req: Request, res: Response, next: NextFunction) {
    try {
      const driverId = req.user!.userId;
      const tripId = req.params.tripId || req.params.id;
      const trip = await DriverService.getTripDetails(tripId, driverId);
      sendSuccess(res, 'Trip details retrieved.', trip);
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

  public static async reportDelay(req: Request, res: Response, next: NextFunction) {
    try {
      const driverId = req.user!.userId;
      const tripId = req.params.tripId;
      const { delay_minutes, delayMinutes, reason, current_stop_id, currentStopId, notes } = req.body;
      const result = await DriverService.reportDelay(tripId, driverId, {
        delayMinutes: Number(delay_minutes || delayMinutes || 15),
        reason: reason || 'TRAFFIC',
        currentStopId: current_stop_id || currentStopId,
        notes,
      });
      sendSuccess(res, 'Trip delay reported and passengers notified.', result);
    } catch (err) {
      next(err);
    }
  }

  public static async updatePassengerStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const driverId = req.user!.userId;
      const tripId = req.params.tripId;
      const studentId = req.params.studentId;
      const { status, notes } = req.body;
      const result = await DriverService.updatePassengerStatus(tripId, driverId, studentId, status, notes);
      sendSuccess(res, `Passenger status updated to ${status}.`, result);
    } catch (err) {
      next(err);
    }
  }
}
