import { Router, Response } from 'express';
import { z } from 'zod';
import { getDb } from '../utils/db.js';
import { authenticateToken } from '../middleware/auth.js';
import type { AuthRequest, BudgetBody } from '../types/express.js';

const router: Router = Router();

const budgetSchema = z.object({
  category_id: z.number().int().positive(),
  amount: z.number().positive(),
  period: z.enum(['monthly', 'yearly']),
});

interface Budget {
  id: number;
  user_id: number;
  category_id: number;
  amount: number;
  period: 'monthly' | 'yearly';
  created_at: string;
  category_name?: string;
  category_color?: string;
  spent?: number;
}

router.get('/', authenticateToken, (req: AuthRequest, res: Response): void => {
  try {
    const db = getDb();
    const budgets = db.prepare(`
      SELECT b.*, c.name as category_name, c.color as category_color,
             COALESCE(SUM(e.amount), 0) as spent
      FROM budgets b
      JOIN categories c ON b.category_id = c.id
      LEFT JOIN expenses e ON e.category_id = b.category_id
        AND e.user_id = b.user_id
        AND (
          (b.period = 'monthly' AND strftime('%Y-%m', e.date) = strftime('%Y-%m', 'now'))
          OR
          (b.period = 'yearly' AND strftime('%Y', e.date) = strftime('%Y', 'now'))
        )
      WHERE b.user_id = ?
      GROUP BY b.id
      ORDER BY c.name
    `).all(req.userId) as Budget[];
    
    res.json(budgets);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch budgets' });
  }
});

router.post('/', authenticateToken, (req: AuthRequest, res: Response): void => {
  try {
    const budgetData = budgetSchema.parse(req.body) as BudgetBody;
    const db = getDb();
    
    const existing = db.prepare(
      'SELECT id FROM budgets WHERE user_id = ? AND category_id = ? AND period = ?'
    ).get(req.userId, budgetData.category_id, budgetData.period) as { id: number } | undefined;
    
    if (existing) {
      res.status(400).json({ error: 'Budget already exists for this category and period' });
      return;
    }
    
    const result = db.prepare(
      'INSERT INTO budgets (user_id, category_id, amount, period) VALUES (?, ?, ?, ?)'
    ).run(req.userId, budgetData.category_id, budgetData.amount, budgetData.period);
    
    const budget = db.prepare(`
      SELECT b.*, c.name as category_name, c.color as category_color
      FROM budgets b
      JOIN categories c ON b.category_id = c.id
      WHERE b.id = ?
    `).get(result.lastInsertRowid) as Budget;
    
    res.status(201).json(budget);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors });
      return;
    }
    res.status(500).json({ error: 'Failed to create budget' });
  }
});

router.put('/:id', authenticateToken, (req: AuthRequest, res: Response): void => {
  try {
    const budgetData = budgetSchema.parse(req.body) as BudgetBody;
    const db = getDb();
    
    const existing = db.prepare('SELECT id FROM budgets WHERE id = ? AND user_id = ?')
      .get(req.params.id, req.userId) as { id: number } | undefined;
    
    if (!existing) {
      res.status(404).json({ error: 'Budget not found' });
      return;
    }
    
    db.prepare('UPDATE budgets SET category_id = ?, amount = ?, period = ? WHERE id = ?')
      .run(budgetData.category_id, budgetData.amount, budgetData.period, req.params.id);
    
    const budget = db.prepare(`
      SELECT b.*, c.name as category_name, c.color as category_color
      FROM budgets b
      JOIN categories c ON b.category_id = c.id
      WHERE b.id = ?
    `).get(req.params.id) as Budget;
    
    res.json(budget);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors });
      return;
    }
    res.status(500).json({ error: 'Failed to update budget' });
  }
});

router.delete('/:id', authenticateToken, (req: AuthRequest, res: Response): void => {
  try {
    const db = getDb();
    
    const existing = db.prepare('SELECT id FROM budgets WHERE id = ? AND user_id = ?')
      .get(req.params.id, req.userId) as { id: number } | undefined;
    
    if (!existing) {
      res.status(404).json({ error: 'Budget not found' });
      return;
    }
    
    db.prepare('DELETE FROM budgets WHERE id = ?').run(req.params.id);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete budget' });
  }
});

export default router;