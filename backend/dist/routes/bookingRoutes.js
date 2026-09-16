"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bookingController_1 = require("../controllers/bookingController");
const auth_1 = require("../middleware/auth");
const rbac_1 = require("../middleware/rbac");
const auditLog_1 = require("../middleware/auditLog");
const router = (0, express_1.Router)();
router.use(auth_1.authenticateJwt);
// Student booking actions
router.post('/check-availability', (0, rbac_1.requireRole)(['STUDENT']), bookingController_1.BookingController.checkAvailability);
router.post('/', (0, rbac_1.requireRole)(['STUDENT']), (0, auditLog_1.auditLog)('BOOK_RIDE', 'bookings'), bookingController_1.BookingController.bookRide);
router.post('/:id/cancel', (0, rbac_1.requireRole)(['STUDENT']), (0, auditLog_1.auditLog)('CANCEL_BOOKING', 'bookings'), bookingController_1.BookingController.cancelBooking);
// Admin view all bookings
router.get('/', (0, rbac_1.requireRole)(['ADMIN']), bookingController_1.BookingController.getAllBookings);
exports.default = router;
//# sourceMappingURL=bookingRoutes.js.map