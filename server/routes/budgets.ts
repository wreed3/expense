import express from 'express';
import { z } from 'zod';
import { getDb } from '../utils/db.js';
import { authenticate } from '../middleware/auth.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

const budgetSchema = z.object({
  category_id: z.number().int().positive(),
  amount: z.number().positive(),
  month: z.string().regex(/^\d{4}-\d{2}$/)
});

// Get all budgets with spending info
router.get('/', authenticate, (req, res, next) => {
  try {
    const db = getDb();
    const { month } = req.query;

    let query = `
      SELECT 
        b.*,
        c.name as category_name,
        c.color as category_color,
        COALESCE(SUM(e.amount), 0) as spent
      FROM budgets b
      JOIN categories c ON b.category_id = c.id
      LEFT JOIN expenses e ON e.category_id = b.category_id 
        AND strftime('%Y-%m', e.date) = b.month
      WHERE b.user_id = ?
    `;
    const params: any[] = [req.userId];

    if (month) {
      query += ' AND b.month = ?';
      params.push(month);
    }

    query += ' GROUP BY b.id ORDER BY b.month DESC, c.name';

    const budgets = db.prepare(query).all(...params);
    res.json(budgets);
  } catch (error) {
    next(error);
  }
});

// Create budget
router.post('/', authenticate, (req, res, next) => {
  try {
    const data = budgetSchema.parse(req.body);
    const db = getDb();

    // Verify category belongs to user
    const category = db.prepare(
      'SELECT id FROM categories WHERE id = ? AND user_id = ?'
    ).get(data.category_id, req.userId);

    if (!category) {
      return res.status(400).json({ error: 'Invalid category' });
    }

    // Check if budget already exists for this category and month
    const existing = db.prepare(
      'SELECT id FROM budgets WHERE user_id = ? AND category_id = ? AND month = ?'
    ).get(req.userId, data.category_id, data.month);

    if (existing) {
      return res.status(400).json({ 
        error: 'Budget already exists for this category and month' 
      });
    }

    const result = db.prepare(
      'INSERT INTO budgets (user_id, category_id, amount, month) VALUES (?, ?, ?, ?)'
    ).run(req.userId, data.category_id, data.amount, data.month);

    const budget = db.prepare(`
      SELECT 
        b.*,
        c.name as category_name,
        c.color as category_color,
        COALESCE(SUM(e.amount), 0) as spent
      FROM budgets b
      JOIN categories c ON b.category_id = c.id
      LEFT JOIN expenses e ON e.category_id = b.category_id 
        AND strftime('%Y-%m', e.date) = b.month
      WHERE b.id = ?
      GROUP BY b.id
    `).get(result.lastInsertRowid);

    logger.info(`Budget created: ${result.lastInsertRowid} by user ${req.userId}`);
    res.status(201).json(budget);
  } catch (error) {
    next(error);
  }
});

// Update budget
router.put('/:id', authenticate, (req, res, next) => {
  try {
    const data = budgetSchema.parse(req.body);
    const db = getDb();

    // Verify budget belongs to user
    const existing = db.prepare(
      'SELECT id FROM budgets WHERE id = ? AND user_id = ?'
    ).get(req.params.id, req.userId);

    if (!existing) {
      return res.status(404).json({ error: 'Budget not found' });
    }

    // Verify category belongs to user
    const category = db.prepare(
      'SELECT id FROM categories WHERE id = ? AND user_id = ?'
    ).get(data.category_id, req.userId);

    if (!category) {
      return res.status(400).json({ error: 'Invalid category' });
    }

    // Check if update would create duplicate
    const duplicate = db.prepare(
      'SELECT id FROM budgets WHERE user_id = ? AND category_id = ? AND month = ? AND id != ?'
    ).get(req.userId, data.category_id, data.month, req.params.id);

    if (duplicate) {
      return res.status(400).json({ 
        error: 'Budget already exists for this category and month' 
      });
    }

    db.prepare(
      'UPDATE budgets SET category_id = ?, amount = ?, month = ? WHERE id = ? AND user_id = ?'
    ).run(data.category_id, data.amount, data.month, req.params.id, req.userId);

    const budget = db.prepare(`
      SELECT 
        b.*,
        c.name as category_name,
        c.color as category_color,
        COALESCE(SUM(e.amount), 0) as spent
      FROM budgets b
      JOIN categories c ON b.category_id = c.id
      LEFT JOIN expenses e ON e.category_id = b.category_id 
        AND strftime('%Y-%m', e.date) = b.month
      WHERE b.id = ?
      GROUP BY b.id
    `).get(req.params.id);

    logger.info(`Budget updated: ${req.params.id} by user ${req.userId}`);
    res.json(budget);
  } catch (error) {
    next(error);
  }
});

// Delete budget
router.delete('/:id', authenticate, (req, res, next) => {
  try {
    const db = getDb();

    const result = db.prepare(
      'DELETE FROM budgets WHERE id = ? AND user_id = ?'
    ).run(req.params.id, req.userId);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Budget not found' });
    }

    logger.info(`Budget deleted: ${req.params.id} by user ${req.userId}`);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;