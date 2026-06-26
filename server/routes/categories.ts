import express from 'express';
import { z } from 'zod';
import { getDatabase } from '../database/index.js';
import { AppError, asyncHandler } from '../middleware/errorHandler.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';

const router = express.Router();

const categorySchema = z.object({
  name: z.string().min(1),
  color: z.string().regex(/^#[0-9A-F]{6}$/i),
  icon: z.string().min(1),
});

// Get all categories
router.get(
  '/',
  authenticate,
  asyncHandler(async (req: AuthRequest, res) => {
    const db = getDatabase();

    const categories = db
      .prepare(
        `
      SELECT c.*, 
        (SELECT COUNT(*) FROM expenses WHERE category_id = c.id) as expense_count,
        (SELECT COALESCE(SUM(amount), 0) FROM expenses WHERE category_id = c.id) as total_spent
      FROM categories c
      WHERE c.user_id = ?
      ORDER BY c.name
    `
      )
      .all(req.userId!);

    res.json(categories);
  })
);

// Get single category
router.get(
  '/:id',
  authenticate,
  asyncHandler(async (req: AuthRequest, res) => {
    const db = getDatabase();

    const category = db
      .prepare(
        `
      SELECT c.*,
        (SELECT COUNT(*) FROM expenses WHERE category_id = c.id) as expense_count,
        (SELECT COALESCE(SUM(amount), 0) FROM expenses WHERE category_id = c.id) as total_spent
      FROM categories c
      WHERE c.id = ? AND c.user_id = ?
    `
      )
      .get(req.params.id, req.userId!);

    if (!category) {
      throw new AppError('Category not found', 404);
    }

    res.json(category);
  })
);

// Create category
router.post(
  '/',
  authenticate,
  asyncHandler(async (req: AuthRequest, res) => {
    const data = categorySchema.parse(req.body);

    const db = getDatabase();

    // Check if category name already exists for user
    const existing = db
      .prepare('SELECT id FROM categories WHERE user_id = ? AND name = ?')
      .get(req.userId!, data.name);

    if (existing) {
      throw new AppError('Category with this name already exists', 400);
    }

    const result = db
      .prepare(
        'INSERT INTO categories (user_id, name, color, icon) VALUES (?, ?, ?, ?)'
      )
      .run(req.userId!, data.name, data.color, data.icon);

    const category = db
      .prepare('SELECT * FROM categories WHERE id = ?')
      .get(result.lastInsertRowid);

    res.status(201).json(category);
  })
);

// Update category
router.put(
  '/:id',
  authenticate,
  asyncHandler(async (req: AuthRequest, res) => {
    const data = categorySchema.parse(req.body);

    const db = getDatabase();

    // Verify category belongs to user
    const existing = db
      .prepare('SELECT id FROM categories WHERE id = ? AND user_id = ?')
      .get(req.params.id, req.userId!);

    if (!existing) {
      throw new AppError('Category not found', 404);
    }

    // Check if new name conflicts with another category
    const nameConflict = db
      .prepare(
        'SELECT id FROM categories WHERE user_id = ? AND name = ? AND id != ?'
      )
      .get(req.userId!, data.name, req.params.id);

    if (nameConflict) {
      throw new AppError('Category with this name already exists', 400);
    }

    db.prepare(
      'UPDATE categories SET name = ?, color = ?, icon = ? WHERE id = ? AND user_id = ?'
    ).run(data.name, data.color, data.icon, req.params.id, req.userId!);

    const category = db
      .prepare('SELECT * FROM categories WHERE id = ?')
      .get(req.params.id);

    res.json(category);
  })
);

// Delete category
router.delete(
  '/:id',
  authenticate,
  asyncHandler(async (req: AuthRequest, res) => {
    const db = getDatabase();

    // Check if category has expenses
    const expenseCount = db
      .prepare('SELECT COUNT(*) as count FROM expenses WHERE category_id = ?')
      .get(req.params.id) as any;

    if (expenseCount.count > 0) {
      throw new AppError(
        'Cannot delete category with existing expenses. Please reassign or delete expenses first.',
        400
      );
    }

    const result = db
      .prepare('DELETE FROM categories WHERE id = ? AND user_id = ?')
      .run(req.params.id, req.userId!);

    if (result.changes === 0) {
      throw new AppError('Category not found', 404);
    }

    res.status(204).send();
  })
);

export default router;