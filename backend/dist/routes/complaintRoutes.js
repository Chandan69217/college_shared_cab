"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const complaintController_1 = require("../controllers/complaintController");
const auth_1 = require("../middleware/auth");
const rbac_1 = require("../middleware/rbac");
const auditLog_1 = require("../middleware/auditLog");
const router = (0, express_1.Router)();
router.use(auth_1.authenticateJwt);
// Student create support ticket / rate trip
router.post('/', (0, rbac_1.requireRole)(['STUDENT']), (0, auditLog_1.auditLog)('CREATE_COMPLAINT', 'complaints'), complaintController_1.ComplaintController.createComplaint);
router.get('/my', (0, rbac_1.requireRole)(['STUDENT']), complaintController_1.ComplaintController.getStudentComplaints);
router.post('/rate-trip', (0, rbac_1.requireRole)(['STUDENT']), (0, auditLog_1.auditLog)('RATE_TRIP', 'ratings'), complaintController_1.ComplaintController.rateTrip);
// Admin view and reply to complaints
router.get('/', (0, rbac_1.requireRole)(['ADMIN']), complaintController_1.ComplaintController.getAllComplaints);
router.patch('/:id/reply', (0, rbac_1.requireRole)(['ADMIN']), (0, auditLog_1.auditLog)('REPLY_COMPLAINT', 'complaints'), complaintController_1.ComplaintController.replyComplaint);
exports.default = router;
//# sourceMappingURL=complaintRoutes.js.map