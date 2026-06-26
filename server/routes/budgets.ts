import express, { Response } from 'express';
import { z } from 'zod';
import { query, get, run } from '../utils/db.js';
import { authenticateToken } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validateRequest.js';
import logger from '../utils/logger.js';
import type {
  AuthRequest,
  Budget,
  BudgetWithCategory,
  CreateBudgetBody,
  UpdateBudgetBody,
} from '../types/index.js';

const router = express.Router();

// Validation schemas
const createBudgetSchema = z.object({
  category_id: z.number().int().positive('Valid category is required'),
  amount: z.number().positive('Amount must be positive'),
  month: z.string().regex(/^\d{4}-\d{2}$/, 'Month must be in YYYY-MM format'),
});

const updateBudgetSchema = createBudgetSchema.partial();

// Get all budgets
router.get('/', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const { month } = req.query as { month?: string };

    let sql = `
      SELECT b.*, c.name as category_name,
             COALESCE(SUM(e.amount), 0) as spent
      FROM budgets b
      JOIN categories c ON b.category_id = c.id
      LEFT JOIN expenses e ON e.category_id = b.category_id
        AND strftime('%Y-%m', e.date) = b.month
        AND e.user_id = b.user_id
      WHERE b.user_id = ?
    `;
    const params: any[] = [req.user.id];

    if (month) {
      sql += ' AND b.month = ?';
      params.push(month);
    }

    sql += ' GROUP BY b.id ORDER BY b.month DESC, c.name';

    const budgets = await query<BudgetWithCategory>(sql, params);
    res.json(budgets);
  } catch (error) {
    logger.error('Get budgets error:', error);
    res.status(500).json({ message: 'Error fetching budgets' });
  }
});

// Get single budget
router.get('/:id', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const budget = await get<BudgetWithCategory>(
      `SELECT b.*, c.name as category_name,
              COALESCE(SUM(e.amount), 0) as spent
       FROM budgets b
       JOIN categories c ON b.category_id = c.id
       LEFT JOIN expenses e ON e.category_id = b.category_id
         AND strftime('%Y-%m', e.date) = b.month
         AND e.user_id = b.user_id
       WHERE b.id = ? AND b.user_id = ?
       GROUP BY b.id`,
      [req.params.id, req.user.id]
    );

    if (!budget) {
      res.status(404).json({ message: 'Budget not found' });
      return;
    }

    res.json(budget);
  } catch (error) {
    logger.error('Get budget error:', error);
    res.status(500).json({ message: 'Error fetching budget' });
  }
});

// Create budget
router.post(
  '/',
  authenticateToken,
  validateRequest(createBudgetSchema),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ message: 'Not authenticated' });
        return;
      }

      const { category_id, amount, month } = req.body as CreateBudgetBody;

      // Check if budget already exists for this category and month
      const existing = await get<Budget>(
        'SELECT * FROM budgets WHERE user_id = ? AND category_id = ? AND month = ?',
        [req.user.id, category_id, month]
      );

      if (existing) {
        res.status(400).json({
          message: 'Budget already exists for this category and month',
        });
        return;
      }

      const result = await query<Budget>(
        'INSERT INTO budgets (user_id, category_id, amount, month) VALUES (?, ?, ?, ?) RETURNING *',
        [req.user.id, category_id, amount, month]
      );

      logger.info('Budget created:', { budgetId: result[0].id, userId: req.user.id });
      res.status(201).json(result[0]);
    } catch (error) {
      logger.error('Create budget error:', error);
      res.status(500).json({ message: 'Error creating budget' });
    }
  }
);

// Update budget
router.put(
  '/:id',
  authenticateToken,
  validateRequest(updateBudgetSchema),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ message: 'Not authenticated' });
        return;
      }

      const budget = await get<Budget>(
        'SELECT * FROM budgets WHERE id = ? AND user_id = ?',
        [req.params.id, req.user.id]
      );

      if (!budget) {
        res.status(404).json({ message: 'Budget not found' });
        return;
      }

      const updates = req.body as UpdateBudgetBody;

      // Check for duplicate if category or month is being updated
      if (updates.category_id || updates.month) {
        const existing = await get<Budget>(
          'SELECT * FROM budgets WHERE user_id = ? AND category_id = ? AND month = ? AND id != ?',
          [
            req.user.id,
            updates.category_id ?? budget.category_id,
            updates.month ?? budget.month,
            req.params.id,
          ]
        );

        if (existing) {
          res.status(400).json({
            message: 'Budget already exists for this category and month',
          });
          return;
        }
      }

      const result = await query<Budget>(
        `UPDATE budgets
         SET category_id = ?, amount = ?, month = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ? AND user_id = ? RETURNING *`,
        [
          updates.category_id ?? budget.category_id,
          updates.amount ?? budget.amount,
          updates.month ?? budget.month,
          req.params.id,
          req.user.id,
        ]
      );

      logger.info('Budget updated:', { budgetId: req.params.id, userId: req.user.id });
      res.json(result[0]);
    } catch (error) {
      logger.error('Update budget error:', error);
      res.status(500).json({ message: 'Error updating budget' });
    }
  }
);

// Delete budget
router.delete('/:id', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const budget = await get<Budget>(
      'SELECT * FROM budgets WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );

    if (!budget) {
      res.status(404).json({ message: 'Budget not found' });
      return;
    }

    await run('DELETE FROM budgets WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);

    logger.info('Budget deleted:', { budgetId: req.params.id, userId: req.user.id });
    res.json({ message: 'Budget deleted successfully' });
  } catch (error) {
    logger.error('Delete budget error:', error);
    res.status(500).json({ message: 'Error deleting budget' });
  }
});

export default router;