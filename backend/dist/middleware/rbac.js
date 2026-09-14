"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireRole = requireRole;
const response_1 = require("../utils/response");
function requireRole(allowedRoles) {
    return (req, res, next) => {
        if (!req.user) {
            (0, response_1.sendError)(res, 'Authentication required.', 'UNAUTHORIZED', null, 401);
            return;
        }
        if (!allowedRoles.includes(req.user.role)) {
            (0, response_1.sendError)(res, `Access denied. Requires one of roles: [${allowedRoles.join(', ')}].`, 'FORBIDDEN', null, 403);
            return;
        }
        next();
    };
}
//# sourceMappingURL=rbac.js.map