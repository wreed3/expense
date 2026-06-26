import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { logger } from '../utils/logger';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  logger.error('Error:', err);

  // Zod validation errors
  if (err instanceof ZodError) {
    return res.status(400).json({
      message: 'Validation error',
      errors: err.errors.map(e => ({
        field: e.path.join('.'),
        message: e.message,
      })),
    });
  }

  // Multer file upload errors
  if (err.message.includes('File too large')) {
    return res.status(400).json({
      message: 'File size exceeds maximum allowed size',
    });
  }

  if (err.message.includes('Invalid file type')) {
    return res.status(400).json({
      message: err.message,
    });
  }

  // SQLite errors
  if (err.message.includes('UNIQUE constraint failed')) {
    return res.status(400).json({
      message: 'A record with this value already exists',
    });
  }

  if (err.message.includes('FOREIGN KEY constraint failed')) {
    return res.status(400).json({
      message: 'Invalid reference to related record',
    });
  }

  // Default error
  res.status(500).json({
    message: 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { error: err.message }),
  });
}