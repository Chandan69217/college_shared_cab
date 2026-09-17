"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const notificationController_1 = require("../controllers/notificationController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Authenticated user notification routes (Student, Driver, Admin)
router.get('/', auth_1.authenticateJwt, notificationController_1.NotificationController.getUserNotifications);
router.get('/unread-count', auth_1.authenticateJwt, notificationController_1.NotificationController.getUnreadCount);
router.post('/read-all', auth_1.authenticateJwt, notificationController_1.NotificationController.markAllAsRead);
router.post('/device-token', auth_1.authenticateJwt, notificationController_1.NotificationController.registerDeviceToken);
router.delete('/device-token', auth_1.authenticateJwt, notificationController_1.NotificationController.removeDeviceToken);
router.post('/:id/read', auth_1.authenticateJwt, notificationController_1.NotificationController.markAsRead);
exports.default = router;
//# sourceMappingURL=notificationRoutes.js.map