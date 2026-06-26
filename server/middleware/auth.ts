import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  userId?: number;
  user?: {
    id: number;
    email: string;
    name?: string;
  };
}

export function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: number; email: string; name?: string };
    req.userId = decoded.userId;
    req.user = {
      id: decoded.userId,
      email: decoded.email,
      name: decoded.name,
    };
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ error: 'Token expired', code: 'TOKEN_EXPIRED' });
    }
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(403).json({ error: 'Invalid token', code: 'INVALID_TOKEN' });
    }
    return res.status(403).json({ error: 'Token verification failed' });
  }
}

export function optionalAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: number; email: string; name?: string };
    req.userId = decoded.userId;
    req.user = {
      id: decoded.userId,
      email: decoded.email,
      name: decoded.name,
    };
  } catch (error) {
    // Silently fail for optional auth
  }
  
  next();
}