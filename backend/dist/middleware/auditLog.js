"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.auditLog = auditLog;
const db_1 = require("../database/db");
function auditLog(action, resource) {
    return (req, res, next) => {
        // Execute action
        const originalSend = res.send;
        res.send = function (body) {
            if (res.statusCode >= 200 && res.statusCode < 300) {
                db_1.db.auditLogs.push({
                    id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
                    user_id: req.user?.userId || null,
                    action,
                    resource,
                    resource_id: req.params.id || null,
                    metadata: {
                        method: req.method,
                        url: req.originalUrl,
                        query: req.query,
                        body: req.method !== 'GET' ? req.body : undefined,
                    },
                    ip_address: req.ip || req.socket.remoteAddress,
                    created_at: new Date().toISOString(),
                });
            }
            return originalSend.apply(res, arguments);
        };
        next();
    };
}
//# sourceMappingURL=auditLog.js.map