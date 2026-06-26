import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export interface ApiError extends Error {
  statusCode?: number;
  code?: string;
}

export function errorHandler(err: ApiError, req: Request, res: Response, next: NextFunction) {
  console.error('Error:', err);

  // Zod validation errors
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: err.errors.map((e) => ({
        path: e.path.join('.'),
        message: e.message,
      })),
    });
  }

  // Custom API errors
  if (err.statusCode) {
    return res.status(err.statusCode).json({
      error: err.message,
      code: err.code || 'API_ERROR',
    });
  }

  // Database errors
  if (err.message.includes('UNIQUE constraint failed')) {
    return res.status(409).json({
      error: 'Resource already exists',
      code: 'DUPLICATE_RESOURCE',
    });
  }

  if (err.message.includes('FOREIGN KEY constraint failed')) {
    return res.status(400).json({
      error: 'Invalid reference',
      code: 'INVALID_REFERENCE',
    });
  }

  // Default error
  res.status(500).json({
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message,
    code: 'INTERNAL_ERROR',
  });
}

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({
    error: 'Route not found',
    code: 'NOT_FOUND',
    path: req.path,
  });
}