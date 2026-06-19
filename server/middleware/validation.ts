import { Request, Response, NextFunction } from 'express';
import { z, ZodError } from 'zod';

export const validate = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        });
      }
      next(error);
    }
  };
};

// Common validation schemas
export const schemas = {
  expense: z.object({
    description: z.string().min(1).max(255),
    amount: z.number().positive(),
    category_id: z.number().int().positive(),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    notes: z.string().max(1000).optional(),
  }),

  category: z.object({
    name: z.string().min(1).max(100),
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
    icon: z.string().min(1).max(10),
  }),

  budget: z.object({
    category_id: z.number().int().positive(),
    amount: z.number().positive(),
    period: z.enum(['monthly', 'yearly']),
    start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    alert_threshold: z.number().int().min(0).max(100).default(80),
  }),

  tag: z.object({
    name: z.string().min(1).max(50),
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  }),

  recurringExpense: z.object({
    description: z.string().min(1).max(255),
    amount: z.number().positive(),
    category_id: z.number().int().positive(),
    frequency: z.enum(['daily', 'weekly', 'monthly', 'yearly']),
    start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  }),

  register: z.object({
    email: z.string().email(),
    password: z.string().min(8).max(100),
    name: z.string().min(1).max(100),
  }),

  login: z.object({
    email: z.string().email(),
    password: z.string(),
  }),
};