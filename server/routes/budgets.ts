import express from 'express';
import { z } from 'zod';
import { getDatabase } from '../database/index.js';
import { AppError, asyncHandler } from '../middleware/errorHandler.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';

const router = express.Router();

const budgetSchema = z.object({
  categoryId: z.number(),
  amount: z.number().positive(),
  month: z.string().regex(/^\d{4}-\d{2}$/),
  alertThreshold: z.number().min(0).max(1).optional(),
});

// Get all budgets
router.get(
  '/',
  authenticate,
  asyncHandler(async (req: AuthRequest, res) => {
    const db = getDatabase();
    const { month } = req.query;

    let query = `
      SELECT b.*, c.name as category_name, c.color as category_color,
        (SELECT COALESCE(SUM(amount), 0) 
         FROM expenses 
         WHERE category_id = b.category_id 
         AND strftime('%Y-%m', date) = b.month) as spent
      FROM budgets b
      JOIN categories c ON b.category_id = c.id
      WHERE b.user_id = ?
    `;
    const params: any[] = [req.userId!];

    if (month) {
      query += ' AND b.month = ?';
      params.push(month);
    }

    query += ' ORDER BY b.month DESC, c.name';

    const budgets = db.prepare(query).all(...params);

    res.json(budgets);
  })
);

// Get single budget
router.get(
  '/:id',
  authenticate,
  asyncHandler(async (req: AuthRequest, res) => {
    const db = getDatabase();

    const budget = db
      .prepare(
        `
      SELECT b.*, c.name as category_name, c.color as category_color,
        (SELECT COALESCE(SUM(amount), 0) 
         FROM expenses 
         WHERE category_id = b.category_id 
         AND strftime('%Y-%m', date) = b.month) as spent
      FROM budgets b
      JOIN categories c ON b.category_id = c.id
      WHERE b.id = ? AND b.user_id = ?
    `
      )
      .get(req.params.id, req.userId!);

    if (!budget) {
      throw new AppError('Budget not found', 404);
    }

    res.json(budget);
  })
);

// Create budget
router.post(
  '/',
  authenticate,
  asyncHandler(async (req: AuthRequest, res) => {
    const data = budgetSchema.parse(req.body);

    const db = getDatabase();

    // Verify category belongs to user
    const category = db
      .prepare('SELECT id FROM categories WHERE id = ? AND user_id = ?')
      .get(data.categoryId, req.userId!);

    if (!category) {
      throw new AppError('Category not found', 404);
    }

    // Check if budget already exists for this category and month
    const existing = db
      .prepare(
        'SELECT id FROM budgets WHERE user_id = ? AND category_id = ? AND month = ?'
      )
      .get(req.userId!, data.categoryId, data.month);

    if (existing) {
      throw new AppError('Budget already exists for this category and month', 400);
    }

    const result = db
      .prepare(
        `
      INSERT INTO budgets (user_id, category_id, amount, month, alert_threshold)
      VALUES (?, ?, ?, ?, ?)
    `
      )
      .run(
        req.userId!,
        data.categoryId,
        data.amount,
        data.month,
        data.alertThreshold || 0.8
      );

    const budget = db
      .prepare(
        `
      SELECT b.*, c.name as category_name, c.color as category_color,
        (SELECT COALESCE(SUM(amount), 0) 
         FROM expenses 
         WHERE category_id = b.category_id 
         AND strftime('%Y-%m', date) = b.month) as spent
      FROM budgets b
      JOIN categories c ON b.category_id = c.id
      WHERE b.id = ?
    `
      )
      .get(result.lastInsertRowid);

    res.status(201).json(budget);
  })
);

// Update budget
router.put(
  '/:id',
  authenticate,
  asyncHandler(async (req: AuthRequest, res) => {
    const data = budgetSchema.parse(req.body);

    const db = getDatabase();

    // Verify budget belongs to user
    const existing = db
      .prepare('SELECT id FROM budgets WHERE id = ? AND user_id = ?')
      .get(req.params.id, req.userId!);

    if (!existing) {
      throw new AppError('Budget not found', 404);
    }

    // Verify category belongs to user
    const category = db
      .prepare('SELECT id FROM categories WHERE id = ? AND user_id = ?')
      .get(data.categoryId, req.userId!);

    if (!category) {
      throw new AppError('Category not found', 404);
    }

    // Check if new category/month combination conflicts
    const conflict = db
      .prepare(
        'SELECT id FROM budgets WHERE user_id = ? AND category_id = ? AND month = ? AND id != ?'
      )
      .get(req.userId!, data.categoryId, data.month, req.params.id);

    if (conflict) {
      throw new AppError('Budget already exists for this category and month', 400);
    }

    db.prepare(
      `
      UPDATE budgets
      SET category_id = ?, amount = ?, month = ?, alert_threshold = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND user_id = ?
    `
    ).run(
      data.categoryId,
      data.amount,
      data.month,
      data.alertThreshold || 0.8,
      req.params.id,
      req.userId!
    );

    const budget = db
      .prepare(
        `
      SELECT b.*, c.name as category_name, c.color as category_color,
        (SELECT COALESCE(SUM(amount), 0) 
         FROM expenses 
         WHERE category_id = b.category_id 
         AND strftime('%Y-%m', date) = b.month) as spent
      FROM budgets b
      JOIN categories c ON b.category_id = c.id
      WHERE b.id = ?
    `
      )
      .get(req.params.id);

    res.json(budget);
  })
);

// Delete budget
router.delete(
  '/:id',
  authenticate,
  asyncHandler(async (req: AuthRequest, res) => {
    const db = getDatabase();

    const result = db
      .prepare('DELETE FROM budgets WHERE id = ? AND user_id = ?')
      .run(req.params.id, req.userId!);

    if (result.changes === 0) {
      throw new AppError('Budget not found', 404);
    }

    res.status(204).send();
  })
);

export default router;