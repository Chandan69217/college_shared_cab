"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QrController = void 0;
const qrPassService_1 = require("../services/qrPassService");
const schemas_1 = require("../validators/schemas");
const response_1 = require("../utils/response");
class QrController {
    static async getStudentQr(req, res, next) {
        try {
            const studentId = req.user.userId;
            const passId = req.params.passId;
            const result = await qrPassService_1.QrPassService.getDynamicQrForStudent(studentId, passId);
            (0, response_1.sendSuccess)(res, 'Dynamic QR token generated.', result);
        }
        catch (err) {
            next(err);
        }
    }
    static async verifyScan(req, res, next) {
        try {
            const driverId = req.user.userId;
            const validated = schemas_1.verifyQrScanSchema.parse(req.body);
            const result = await qrPassService_1.QrPassService.verifyAndBoard(driverId, validated.trip_id, validated.token, validated.client_latitude, validated.client_longitude);
            if (result.authorized) {
                (0, response_1.sendSuccess)(res, result.message, result);
            }
            else {
                // Return 200 with authorized: false so driver UI displays red NOT AUTHORIZED badge clearly
                (0, response_1.sendSuccess)(res, result.message, result, 200);
            }
        }
        catch (err) {
            next(err);
        }
    }
}
exports.QrController = QrController;
//# sourceMappingURL=qrController.js.map