import { db } from '../database/db';
import { generateDynamicQrToken, verifyDynamicQrToken } from '../utils/crypto';
import { DailyTravelPass } from '../types';

export interface QrVerificationResponse {
  authorized: boolean;
  status: 'AUTHORIZED' | 'NOT_AUTHORIZED';
  reason?: string;
  message: string;
  student?: {
    id: string;
    full_name: string;
    phone: string;
    course: string;
    student_id_number: string;
  };
  pickupPoint?: {
    name: string;
    address: string;
  };
  scannedAt: string;
}

export class QrPassService {
  /**
   * Generates a fresh dynamic signed QR token for a student's active daily pass
   */
  public static async getDynamicQrForStudent(
    studentId: string,
    passId: string
  ): Promise<{ pass: DailyTravelPass; qrToken: string; expiresAt: string }> {
    const pass = db.dailyPasses.get(passId);
    if (!pass) {
      const err: any = new Error('Daily travel pass not found.');
      err.statusCode = 404;
      err.code = 'PASS_NOT_FOUND';
      throw err;
    }

    if (pass.student_id !== studentId) {
      const err: any = new Error('Unauthorized to view this travel pass.');
      err.statusCode = 403;
      err.code = 'UNAUTHORIZED';
      throw err;
    }

    if (pass.status !== 'ACTIVE') {
      const err: any = new Error(`Pass is no longer active (status: ${pass.status}).`);
      err.statusCode = 400;
      err.code = 'PASS_INACTIVE';
      throw err;
    }

    const { token, expiresAt } = generateDynamicQrToken(
      pass.id,
      pass.student_id,
      pass.trip_id,
      pass.route_id,
      pass.pass_date,
      60 // 60 mins validity
    );

    return { pass, qrToken: token, expiresAt };
  }

  /**
   * Driver QR Scan Verification & Boarding Processor
   */
  public static async verifyAndBoard(
    driverId: string,
    tripId: string,
    token: string,
    clientLat?: number,
    clientLng?: number
  ): Promise<QrVerificationResponse> {
    const now = new Date().toISOString();

    // 1. Verify Driver assignment to this trip
    const trip = db.trips.get(tripId);
    if (!trip) {
      this.logScan(null, tripId, null, driverId, 'NOT_AUTHORIZED', 'TRIP_NOT_FOUND', clientLat, clientLng);
      return {
        authorized: false,
        status: 'NOT_AUTHORIZED',
        reason: 'TRIP_NOT_FOUND',
        message: 'Trip does not exist in system.',
        scannedAt: now,
      };
    }

    if (trip.driver_id !== driverId) {
      this.logScan(null, tripId, null, driverId, 'NOT_AUTHORIZED', 'UNAUTHORIZED_DRIVER', clientLat, clientLng);
      return {
        authorized: false,
        status: 'NOT_AUTHORIZED',
        reason: 'UNAUTHORIZED_DRIVER',
        message: 'You are not assigned as the driver for this trip.',
        scannedAt: now,
      };
    }

    // 2. Cryptographic signature and expiration check
    const verification = verifyDynamicQrToken(token);
    if (!verification.isValid) {
      const reason = verification.isExpired ? 'TOKEN_EXPIRED' : (verification.error || 'INVALID_SIGNATURE');
      this.logScan(null, tripId, null, driverId, 'NOT_AUTHORIZED', reason, clientLat, clientLng);
      return {
        authorized: false,
        status: 'NOT_AUTHORIZED',
        reason,
        message: verification.isExpired
          ? 'QR Code expired. Student must refresh their daily pass.'
          : 'Tampered or counterfeit QR code signature.',
        scannedAt: now,
      };
    }

    const payload = verification.payload!;

    // 3. Trip match check
    if (payload.tripId !== tripId) {
      this.logScan(payload.passId, tripId, payload.studentId, driverId, 'NOT_AUTHORIZED', 'WRONG_TRIP', clientLat, clientLng);
      return {
        authorized: false,
        status: 'NOT_AUTHORIZED',
        reason: 'WRONG_TRIP',
        message: 'This pass is for a different scheduled trip.',
        scannedAt: now,
      };
    }

    // 4. Retrieve and inspect Pass status
    const pass = db.dailyPasses.get(payload.passId);
    if (!pass) {
      this.logScan(payload.passId, tripId, payload.studentId, driverId, 'NOT_AUTHORIZED', 'PASS_NOT_FOUND', clientLat, clientLng);
      return {
        authorized: false,
        status: 'NOT_AUTHORIZED',
        reason: 'PASS_NOT_FOUND',
        message: 'Travel pass record not found in system.',
        scannedAt: now,
      };
    }

    // Anti-replay attack check
    if (pass.status === 'USED') {
      this.logScan(pass.id, tripId, pass.student_id, driverId, 'NOT_AUTHORIZED', 'ALREADY_USED', clientLat, clientLng);
      return {
        authorized: false,
        status: 'NOT_AUTHORIZED',
        reason: 'ALREADY_USED',
        message: 'REPLAY DETECTED: This pass has already been used for boarding.',
        scannedAt: now,
      };
    }

    if (pass.status !== 'ACTIVE') {
      this.logScan(pass.id, tripId, pass.student_id, driverId, 'NOT_AUTHORIZED', 'PASS_INACTIVE', clientLat, clientLng);
      return {
        authorized: false,
        status: 'NOT_AUTHORIZED',
        reason: 'PASS_INACTIVE',
        message: `Pass is ${pass.status.toLowerCase()}. Cannot be used for travel.`,
        scannedAt: now,
      };
    }

    // 5. Successful validation - Atomic updates
    pass.status = 'USED';
    pass.used_at = now;
    pass.updated_at = now;
    db.dailyPasses.set(pass.id, pass);

    // Update manifest
    const manifestKey = `${tripId}_${pass.student_id}`;
    const passenger = db.tripPassengers.get(manifestKey);
    if (passenger) {
      passenger.status = 'BOARDED';
      passenger.boarded_at = now;
      passenger.verified_by_driver_id = driverId;
      passenger.updated_at = now;
      db.tripPassengers.set(manifestKey, passenger);
    }

    // Update trip statistics
    trip.boarded_passengers = (trip.boarded_passengers || 0) + 1;
    trip.updated_at = now;
    db.trips.set(tripId, trip);

    // Record audit log
    this.logScan(pass.id, tripId, pass.student_id, driverId, 'AUTHORIZED', undefined, clientLat, clientLng);

    const studentUser = db.users.get(pass.student_id);
    const studentProfile = db.studentProfiles.get(pass.student_id);
    const pickupPoint = db.pickupPoints.get(pass.pickup_point_id);

    return {
      authorized: true,
      status: 'AUTHORIZED',
      message: `Boarding Approved for ${studentUser?.full_name || 'Student'}.`,
      student: {
        id: pass.student_id,
        full_name: studentUser?.full_name || 'Unknown Student',
        phone: studentUser?.phone || '',
        course: studentProfile?.course || '',
        student_id_number: studentProfile?.student_id_number || '',
      },
      pickupPoint: {
        name: pickupPoint?.name || 'Assigned Stop',
        address: pickupPoint?.address || '',
      },
      scannedAt: now,
    };
  }

  private static logScan(
    passId: string | null,
    tripId: string,
    studentId: string | null,
    driverId: string,
    result: 'AUTHORIZED' | 'NOT_AUTHORIZED',
    rejectionReason?: string,
    clientLat?: number,
    clientLng?: number
  ) {
    db.qrScanLogs.push({
      id: `scan-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      pass_id: passId,
      trip_id: tripId,
      student_id: studentId,
      driver_id: driverId,
      scan_result: result,
      rejection_reason: rejectionReason,
      client_latitude: clientLat,
      client_longitude: clientLng,
      scanned_at: new Date().toISOString(),
    });
  }
}
