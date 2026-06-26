import { Request, Response, NextFunction } from 'express';
import { getDatabase } from '../database/index.js';
import logger from '../utils/logger.js';

export function auditLog(req: Request, _res: Response, next: NextFunction) {
  try {
    const db = getDatabase();
    const userId = (req as any).user?.id;
    const action = `${req.method} ${req.path}`;
    const details = JSON.stringify({
      body: req.body,
      params: req.params,
      query: req.query,
    });

    const stmt = db.prepare(`
      INSERT INTO audit_logs (user_id, action, details, ip_address, user_agent)
      VALUES (?, ?, ?, ?, ?)
    `);

    stmt.run(
      userId || null,
      action,
      details,
      req.ip,
      req.get('user-agent') || null
    );

    logger.info(`Audit log: ${action} by user ${userId || 'anonymous'}`);
  } catch (error) {
    logger.error('Failed to create audit log:', error);
  }

  next();
}