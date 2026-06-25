import { Request, Response, NextFunction } from 'express';
import { db } from '../db';
import { logger } from '../utils/logger';

export interface AuditLogEntry {
  userId: number;
  action: string;
  resourceType: string;
  resourceId?: number;
  details?: any;
  ipAddress?: string;
  userAgent?: string;
}

export function auditLogMiddleware(req: Request, res: Response, next: NextFunction) {
  const user = (req as any).user;
  
  // Store original send function
  const originalSend = res.json.bind(res);

  // Override send to log after successful operations
  res.json = function (data: any) {
    // Log successful write operations
    if (res.statusCode >= 200 && res.statusCode < 300) {
      if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
        const action = getActionFromMethod(req.method);
        const { resourceType, resourceId } = parseResourceFromPath(req.path);

        if (user && resourceType) {
          logAudit({
            userId: user.id,
            action,
            resourceType,
            resourceId,
            details: {
              method: req.method,
              path: req.path,
              body: sanitizeBody(req.body),
            },
            ipAddress: req.ip,
            userAgent: req.get('user-agent'),
          }).catch((err) => {
            logger.error('Audit log error:', err);
          });
        }
      }
    }

    return originalSend(data);
  };

  next();
}

async function logAudit(entry: AuditLogEntry) {
  try {
    await db.run(
      `INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details, ip_address, user_agent, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
      [
        entry.userId,
        entry.action,
        entry.resourceType,
        entry.resourceId || null,
        JSON.stringify(entry.details || {}),
        entry.ipAddress || null,
        entry.userAgent || null,
      ]
    );
  } catch (error) {
    logger.error('Failed to write audit log:', error);
  }
}

function getActionFromMethod(method: string): string {
  const actions: Record<string, string> = {
    POST: 'create',
    PUT: 'update',
    PATCH: 'update',
    DELETE: 'delete',
  };
  return actions[method] || 'unknown';
}

function parseResourceFromPath(path: string): { resourceType: string; resourceId?: number } {
  const parts = path.split('/').filter(Boolean);
  
  if (parts.length >= 2) {
    const resourceType = parts[1]; // e.g., 'expenses', 'categories'
    const resourceId = parts[2] ? parseInt(parts[2]) : undefined;
    
    return { resourceType, resourceId };
  }
  
  return { resourceType: 'unknown' };
}

function sanitizeBody(body: any): any {
  if (!body) return {};
  
  const sanitized = { ...body };
  
  // Remove sensitive fields
  delete sanitized.password;
  delete sanitized.token;
  delete sanitized.secret;
  
  return sanitized;
}

// Export function to manually log audit events
export async function logAuditEvent(entry: AuditLogEntry) {
  await logAudit(entry);
}