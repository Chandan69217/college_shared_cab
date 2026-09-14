import { Request, Response, NextFunction } from 'express';
import { QrPassService } from '../services/qrPassService';
import { verifyQrScanSchema } from '../validators/schemas';
import { sendSuccess } from '../utils/response';

export class QrController {
  public static async getStudentQr(req: Request, res: Response, next: NextFunction) {
    try {
      const studentId = req.user!.userId;
      const passId = req.params.passId;
      const result = await QrPassService.getDynamicQrForStudent(studentId, passId);
      sendSuccess(res, 'Dynamic QR token generated.', result);
    } catch (err) {
      next(err);
    }
  }

  public static async verifyScan(req: Request, res: Response, next: NextFunction) {
    try {
      const driverId = req.user!.userId;
      const validated = verifyQrScanSchema.parse(req.body);
      const result = await QrPassService.verifyAndBoard(
        driverId,
        validated.trip_id,
        validated.token,
        validated.client_latitude,
        validated.client_longitude
      );

      if (result.authorized) {
        sendSuccess(res, result.message, result);
      } else {
        // Return 200 with authorized: false so driver UI displays red NOT AUTHORIZED badge clearly
        sendSuccess(res, result.message, result, 200);
      }
    } catch (err) {
      next(err);
    }
  }
}
