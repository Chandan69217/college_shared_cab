"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QrPassService = void 0;
const crypto_1 = require("../utils/crypto");
const supabaseClient_1 = require("../database/supabaseClient");
const tripRepository_1 = require("../repositories/tripRepository");
const userRepository_1 = require("../repositories/userRepository");
const pickupPointRepository_1 = require("../repositories/pickupPointRepository");
const settingsRepository_1 = require("../repositories/settingsRepository");
const notificationService_1 = require("./notificationService");
class QrPassService {
    /**
     * Generates a fresh dynamic signed QR token for a student's active daily pass in Supabase
     */
    static async getDynamicQrForStudent(studentId, passId) {
        const supabase = (0, supabaseClient_1.getSupabaseClient)();
        const { data: pass, error } = await supabase
            .from('daily_travel_passes')
            .select('*, trip:trips(*), pickup_point:pickup_points!daily_travel_passes_pickup_point_id_fkey(*), drop_point:pickup_points!daily_travel_passes_drop_point_id_fkey(*)')
            .eq('id', passId)
            .maybeSingle();
        if (error || !pass) {
            const err = new Error('Daily travel pass not found.');
            err.statusCode = 404;
            err.code = 'PASS_NOT_FOUND';
            throw err;
        }
        if (pass.student_id !== studentId) {
            const err = new Error('Unauthorized to view this travel pass.');
            err.statusCode = 403;
            err.code = 'UNAUTHORIZED';
            throw err;
        }
        if (pass.status !== 'ACTIVE') {
            const err = new Error(`Pass is no longer active (status: ${pass.status}).`);
            err.statusCode = 400;
            err.code = 'PASS_INACTIVE';
            throw err;
        }
        const { token, expiresAt } = (0, crypto_1.generateDynamicQrToken)(pass.id, pass.student_id, pass.trip_id, pass.route_id, pass.pass_date, 60);
        return { pass: pass, qrToken: token, expiresAt };
    }
    /**
     * Driver QR Scan Verification & Boarding Processor against Supabase
     */
    static async verifyAndBoard(driverId, tripId, token, clientLat, clientLng) {
        const now = new Date().toISOString();
        const supabase = (0, supabaseClient_1.getSupabaseClient)();
        // 1. Verify Driver assignment to this trip in Supabase
        const trip = await tripRepository_1.TripRepository.findById(tripId);
        if (!trip) {
            await this.logScan(null, tripId, null, driverId, 'NOT_AUTHORIZED', 'TRIP_NOT_FOUND', clientLat, clientLng);
            return {
                authorized: false,
                status: 'NOT_AUTHORIZED',
                reason: 'TRIP_NOT_FOUND',
                message: 'Trip does not exist in system.',
                scannedAt: now,
            };
        }
        if (trip.driver_id !== driverId) {
            await this.logScan(null, tripId, null, driverId, 'NOT_AUTHORIZED', 'UNAUTHORIZED_DRIVER', clientLat, clientLng);
            return {
                authorized: false,
                status: 'NOT_AUTHORIZED',
                reason: 'UNAUTHORIZED_DRIVER',
                message: 'You are not assigned as the driver for this trip.',
                scannedAt: now,
            };
        }
        // 2. Cryptographic signature and expiration check
        const verification = (0, crypto_1.verifyDynamicQrToken)(token);
        if (!verification.isValid) {
            const reason = verification.isExpired ? 'TOKEN_EXPIRED' : (verification.error || 'INVALID_SIGNATURE');
            await this.logScan(null, tripId, null, driverId, 'NOT_AUTHORIZED', reason, clientLat, clientLng);
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
        const payload = verification.payload;
        // 3. Trip match check
        if (payload.tripId !== tripId) {
            await this.logScan(payload.passId, tripId, payload.studentId, driverId, 'NOT_AUTHORIZED', 'WRONG_TRIP', clientLat, clientLng);
            return {
                authorized: false,
                status: 'NOT_AUTHORIZED',
                reason: 'WRONG_TRIP',
                message: 'This pass is for a different scheduled trip.',
                scannedAt: now,
            };
        }
        // 4. Retrieve and inspect Pass status from Supabase
        const { data: pass, error: psErr } = await supabase
            .from('daily_travel_passes')
            .select('*')
            .eq('id', payload.passId)
            .maybeSingle();
        if (psErr || !pass) {
            await this.logScan(payload.passId, tripId, payload.studentId, driverId, 'NOT_AUTHORIZED', 'PASS_NOT_FOUND', clientLat, clientLng);
            return {
                authorized: false,
                status: 'NOT_AUTHORIZED',
                reason: 'PASS_NOT_FOUND',
                message: 'Travel pass record not found in system.',
                scannedAt: now,
            };
        }
        // Anti-replay attack check if enabled in settings
        const replayProtection = await settingsRepository_1.SettingsRepository.get('enableDynamicQrReplayProtection', true);
        if (replayProtection && pass.status === 'USED') {
            await this.logScan(pass.id, tripId, pass.student_id, driverId, 'NOT_AUTHORIZED', 'ALREADY_USED', clientLat, clientLng);
            return {
                authorized: false,
                status: 'NOT_AUTHORIZED',
                reason: 'ALREADY_USED',
                message: 'REPLAY DETECTED: This pass has already been used for boarding.',
                scannedAt: now,
            };
        }
        if (pass.status !== 'ACTIVE') {
            await this.logScan(pass.id, tripId, pass.student_id, driverId, 'NOT_AUTHORIZED', 'PASS_INACTIVE', clientLat, clientLng);
            return {
                authorized: false,
                status: 'NOT_AUTHORIZED',
                reason: 'PASS_INACTIVE',
                message: `Pass is ${pass.status.toLowerCase()}. Cannot be used for travel.`,
                scannedAt: now,
            };
        }
        // 5. Successful validation - Atomic updates in Supabase
        await supabase
            .from('daily_travel_passes')
            .update({ status: 'USED', used_at: now, updated_at: now })
            .eq('id', pass.id);
        // Update manifest in Supabase
        await supabase
            .from('trip_passengers')
            .update({ status: 'BOARDED', boarded_at: now, verified_by_driver_id: driverId, updated_at: now })
            .eq('trip_id', tripId)
            .eq('student_id', pass.student_id);
        // Update trip boarded passenger count
        await tripRepository_1.TripRepository.update(tripId, {
            boarded_passengers: (trip.boarded_passengers || 0) + 1,
        });
        // Record audit log
        await this.logScan(pass.id, tripId, pass.student_id, driverId, 'AUTHORIZED', undefined, clientLat, clientLng);
        // Notify student of successful QR boarding verification
        try {
            await notificationService_1.NotificationService.createNotification({
                userId: pass.student_id,
                recipientRole: 'STUDENT',
                title: 'Boarding Confirmed',
                message: 'Your dynamic QR travel pass was successfully verified by the driver. Have a safe journey!',
                type: 'BOARDING_CONFIRMED',
                entityType: 'PASS',
                entityId: pass.id,
                priority: 'NORMAL',
                data: { passId: pass.id, tripId },
            });
        }
        catch (notifErr) {
            // Non-blocking notification error
        }
        const studentUser = await userRepository_1.UserRepository.findById(pass.student_id);
        const studentProfile = await userRepository_1.UserRepository.getStudentProfile(pass.student_id);
        const pickupPoint = await pickupPointRepository_1.PickupPointRepository.findById(pass.pickup_point_id);
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
    static async logScan(passId, tripId, studentId, driverId, result, rejectionReason, clientLat, clientLng) {
        const supabase = (0, supabaseClient_1.getSupabaseClient)();
        if (supabase) {
            await supabase.from('qr_scan_logs').insert([{
                    pass_id: passId,
                    trip_id: tripId,
                    student_id: studentId,
                    driver_id: driverId,
                    scan_result: result,
                    rejection_reason: rejectionReason,
                    client_latitude: clientLat,
                    client_longitude: clientLng,
                    scanned_at: new Date().toISOString(),
                }]).select().maybeSingle();
        }
    }
}
exports.QrPassService = QrPassService;
//# sourceMappingURL=qrPassService.js.map