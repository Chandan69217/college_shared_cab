"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const tripController_1 = require("../controllers/tripController");
const auth_1 = require("../middleware/auth");
const rbac_1 = require("../middleware/rbac");
const auditLog_1 = require("../middleware/auditLog");
const router = (0, express_1.Router)();
router.use(auth_1.authenticateJwt);
// Read trips & locations
router.get('/', tripController_1.TripController.getTrips);
router.get('/active-locations', tripController_1.TripController.getAllActiveLocations);
router.get('/:id/location', tripController_1.TripController.getTripLocation);
router.get('/:tripId/location', tripController_1.TripController.getTripLocation);
router.get('/:id/history', (0, rbac_1.requireRole)(['ADMIN', 'DRIVER']), tripController_1.TripController.getTripHistory);
router.get('/:tripId/history', (0, rbac_1.requireRole)(['ADMIN', 'DRIVER']), tripController_1.TripController.getTripHistory);
// Driver Trip Lifecycle & Live GPS
router.post('/location', (0, rbac_1.requireRole)(['DRIVER']), tripController_1.TripController.updateLocation);
router.post('/:tripId/location', (0, rbac_1.requireRole)(['DRIVER']), tripController_1.TripController.updateLocation);
router.post('/:tripId/start', (0, rbac_1.requireRole)(['DRIVER']), (0, auditLog_1.auditLog)('START_TRIP', 'trips'), tripController_1.TripController.startTrip);
router.post('/:tripId/end', (0, rbac_1.requireRole)(['DRIVER']), (0, auditLog_1.auditLog)('END_TRIP', 'trips'), tripController_1.TripController.endTrip);
// Admin schedule trip
router.post('/', (0, rbac_1.requireRole)(['ADMIN']), (0, auditLog_1.auditLog)('SCHEDULE_TRIP', 'trips'), tripController_1.TripController.createTrip);
exports.default = router;
//# sourceMappingURL=tripRoutes.js.map