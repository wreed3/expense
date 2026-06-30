import express from 'express';
import { z } from 'zod';
import { getDb } from '../utils/db.js';
import { authenticate } from '../middleware/auth.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

const categorySchema = z.object({
  name: z.string().min(1),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/)
});

// Get all categories
router.get('/', authenticate, (req, res, next) => {
  try {
    const db = getDb();
    const categories = db.prepare(
      'SELECT * FROM categories WHERE user_id = ? ORDER BY name'
    ).all(req.userId);

    res.json(categories);
  } catch (error) {
    next(error);
  }
});

// Create category
router.post('/', authenticate, (req, res, next) => {
  try {
    const data = categorySchema.parse(req.body);
    const db = getDb();

    // Check if category name already exists for this user
    const existing = db.prepare(
      'SELECT id FROM categories WHERE user_id = ? AND name = ?'
    ).get(req.userId, data.name);

    if (existing) {
      return res.status(400).json({ error: 'Category name already exists' });
    }

    const result = db.prepare(
      'INSERT INTO categories (user_id, name, color) VALUES (?, ?, ?)'
    ).run(req.userId, data.name, data.color);

    const category = db.prepare(
      'SELECT * FROM categories WHERE id = ?'
    ).get(result.lastInsertRowid);

    logger.info(`Category created: ${data.name} by user ${req.userId}`);
    res.status(201).json(category);
  } catch (error) {
    next(error);
  }
});

// Update category
router.put('/:id', authenticate, (req, res, next) => {
  try {
    const data = categorySchema.parse(req.body);
    const db = getDb();

    // Verify category belongs to user
    const existing = db.prepare(
      'SELECT id FROM categories WHERE id = ? AND user_id = ?'
    ).get(req.params.id, req.userId);

    if (!existing) {
      return res.status(404).json({ error: 'Category not found' });
    }

    // Check if new name conflicts with another category
    const nameConflict = db.prepare(
      'SELECT id FROM categories WHERE user_id = ? AND name = ? AND id != ?'
    ).get(req.userId, data.name, req.params.id);

    if (nameConflict) {
      return res.status(400).json({ error: 'Category name already exists' });
    }

    db.prepare(
      'UPDATE categories SET name = ?, color = ? WHERE id = ? AND user_id = ?'
    ).run(data.name, data.color, req.params.id, req.userId);

    const category = db.prepare(
      'SELECT * FROM categories WHERE id = ?'
    ).get(req.params.id);

    logger.info(`Category updated: ${req.params.id} by user ${req.userId}`);
    res.json(category);
  } catch (error) {
    next(error);
  }
});

// Delete category
router.delete('/:id', authenticate, (req, res, next) => {
  try {
    const db = getDb();

    // Check if category has expenses
    const hasExpenses = db.prepare(
      'SELECT COUNT(*) as count FROM expenses WHERE category_id = ?'
    ).get(req.params.id) as any;

    if (hasExpenses.count > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete category with existing expenses' 
      });
    }

    const result = db.prepare(
      'DELETE FROM categories WHERE id = ? AND user_id = ?'
    ).run(req.params.id, req.userId);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }

    logger.info(`Category deleted: ${req.params.id} by user ${req.userId}`);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;