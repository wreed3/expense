import { Router } from 'express';
import { db } from '../db';
import { authenticate } from '../middleware/auth';
import { z } from 'zod';

const router = Router();

const budgetSchema = z.object({
  category_id: z.number().int().positive(),
  amount: z.number().positive(),
  month: z.string().regex(/^\d{4}-\d{2}$/, 'Month must be in YYYY-MM format'),
});

// Get all budgets for user
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { month } = req.query;
    
    let query = `
      SELECT b.*, c.name as category_name, c.color as category_color
      FROM budgets b
      JOIN categories c ON b.category_id = c.id
      WHERE b.user_id = ?
    `;
    const params: any[] = [req.user!.id];
    
    if (month) {
      query += ' AND b.month = ?';
      params.push(month);
    }
    
    query += ' ORDER BY b.month DESC, c.name';
    
    const budgets = db.prepare(query).all(...params);
    res.json(budgets);
  } catch (error) {
    next(error);
  }
});

// Get budget by ID
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const budget = db.prepare(`
      SELECT b.*, c.name as category_name, c.color as category_color
      FROM budgets b
      JOIN categories c ON b.category_id = c.id
      WHERE b.id = ? AND b.user_id = ?
    `).get(req.params.id, req.user!.id);
    
    if (!budget) {
      return res.status(404).json({ message: 'Budget not found' });
    }
    
    res.json(budget);
  } catch (error) {
    next(error);
  }
});

// Create budget
router.post('/', authenticate, async (req, res, next) => {
  try {
    const validated = budgetSchema.parse(req.body);
    
    // Check if budget already exists for this category and month
    const existing = db.prepare(`
      SELECT * FROM budgets 
      WHERE category_id = ? AND month = ? AND user_id = ?
    `).get(validated.category_id, validated.month, req.user!.id);
    
    if (existing) {
      return res.status(400).json({ message: 'Budget already exists for this category and month' });
    }
    
    const result = db.prepare(`
      INSERT INTO budgets (category_id, amount, month, user_id)
      VALUES (?, ?, ?, ?)
    `).run(validated.category_id, validated.amount, validated.month, req.user!.id);
    
    const budget = db.prepare(`
      SELECT b.*, c.name as category_name, c.color as category_color
      FROM budgets b
      JOIN categories c ON b.category_id = c.id
      WHERE b.id = ?
    `).get(result.lastInsertRowid);
    
    res.status(201).json(budget);
  } catch (error) {
    next(error);
  }
});

// Update budget
router.put('/:id', authenticate, async (req, res, next) => {
  try {
    const validated = budgetSchema.parse(req.body);
    
    const existing = db.prepare(`
      SELECT * FROM budgets 
      WHERE id = ? AND user_id = ?
    `).get(req.params.id, req.user!.id);
    
    if (!existing) {
      return res.status(404).json({ message: 'Budget not found' });
    }
    
    db.prepare(`
      UPDATE budgets 
      SET category_id = ?, amount = ?, month = ?
      WHERE id = ? AND user_id = ?
    `).run(validated.category_id, validated.amount, validated.month, req.params.id, req.user!.id);
    
    const budget = db.prepare(`
      SELECT b.*, c.name as category_name, c.color as category_color
      FROM budgets b
      JOIN categories c ON b.category_id = c.id
      WHERE b.id = ?
    `).get(req.params.id);
    
    res.json(budget);
  } catch (error) {
    next(error);
  }
});

// Delete budget
router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    const budget = db.prepare(`
      SELECT * FROM budgets 
      WHERE id = ? AND user_id = ?
    `).get(req.params.id, req.user!.id);
    
    if (!budget) {
      return res.status(404).json({ message: 'Budget not found' });
    }
    
    db.prepare(`
      DELETE FROM budgets 
      WHERE id = ? AND user_id = ?
    `).run(req.params.id, req.user!.id);
    
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;