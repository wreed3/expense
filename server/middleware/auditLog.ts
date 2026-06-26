import { Request, Response, NextFunction } from 'express';
import { run } from '../database.js';
import { logger } from '../utils/logger.js';

interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
  };
}

export const auditLog = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const startTime = Date.now();

  // Log the request
  const logEntry = {
    timestamp: new Date().toISOString(),
    method: req.method,
    path: req.path,
    userId: req.user?.id || null,
    ip: req.ip,
    userAgent: req.get('user-agent'),
  };

  logger.info('API Request', logEntry);

  // Capture response
  const originalSend = res.send;
  res.send = function (data: any) {
    const duration = Date.now() - startTime;
    
    logger.info('API Response', {
      ...logEntry,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
    });

    // Store audit log in database for important operations
    if (['POST', 'PUT', 'DELETE'].includes(req.method) && req.user) {
      const action = `${req.method} ${req.path}`;
      const details = JSON.stringify({
        body: req.body,
        params: req.params,
        query: req.query,
      });

      run(
        `INSERT INTO audit_logs (user_id, action, details, ip_address, created_at)
         VALUES (?, ?, ?, ?, datetime('now'))`,
        [req.user.id, action, details, req.ip]
      ).catch((error: Error) => {
        logger.error('Failed to save audit log', { error: error.message });
      });
    }

    return originalSend.call(this, data);
  };

  next();
};