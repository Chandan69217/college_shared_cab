import { Request, Response, NextFunction } from 'express';
import { db } from '../database/db';

export function auditLog(action: string, resource: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Execute action
    const originalSend = res.send;
    res.send = function (body) {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        db.auditLogs.push({
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
      return originalSend.apply(res, arguments as any);
    };
    next();
  };
}
