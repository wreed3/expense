import express, { Response } from 'express';
import { query } from '../utils/db.js';
import { authenticateToken } from '../middleware/auth.js';
import logger from '../utils/logger.js';
import type {
  AuthRequest,
  CategorySpending,
  MonthlySpending,
  SpendingSummary,
  AnalyticsQueryParams,
} from '../types/index.js';

const router = express.Router();

// Get spending summary
router.get('/summary', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const { start_date, end_date } = req.query as AnalyticsQueryParams;

    let dateFilter = '';
    const params: any[] = [req.user.id];

    if (start_date && end_date) {
      dateFilter = 'AND e.date BETWEEN ? AND ?';
      params.push(start_date, end_date);
    }

    // Total expenses and amount
    const totals = await query<{ count: number; total: number }>(
      `SELECT COUNT(*) as count, COALESCE(SUM(amount), 0) as total
       FROM expenses e
       WHERE e.user_id = ? ${dateFilter}`,
      params
    );

    // Category breakdown
    const categoryBreakdown = await query<CategorySpending>(
      `SELECT c.id as category_id, c.name as category_name, c.color as category_color,
              COALESCE(SUM(e.amount), 0) as total_spent
       FROM categories c
       LEFT JOIN expenses e ON e.category_id = c.id AND e.user_id = ? ${dateFilter}
       WHERE c.user_id = ?
       GROUP BY c.id
       ORDER BY total_spent DESC`,
      [...params, req.user.id]
    );

    // Monthly trend
    const monthlyTrend = await query<MonthlySpending>(
      `SELECT strftime('%Y-%m', date) as month, SUM(amount) as total
       FROM expenses
       WHERE user_id = ? ${dateFilter}
       GROUP BY month
       ORDER BY month DESC
       LIMIT 12`,
      params
    );

    const summary: SpendingSummary = {
      total_expenses: totals[0]?.count || 0,
      total_spent: totals[0]?.total || 0,
      category_breakdown: categoryBreakdown,
      monthly_trend: monthlyTrend,
    };

    res.json(summary);
  } catch (error) {
    logger.error('Get summary error:', error);
    res.status(500).json({ message: 'Error fetching summary' });
  }
});

// Get spending trends
router.get('/trends', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const { start_date, end_date } = req.query as AnalyticsQueryParams;

    let dateFilter = '';
    const params: any[] = [req.user.id];

    if (start_date && end_date) {
      dateFilter = 'AND date BETWEEN ? AND ?';
      params.push(start_date, end_date);
    }

    const trends = await query<{ date: string; total: number }>(
      `SELECT date, SUM(amount) as total
       FROM expenses
       WHERE user_id = ? ${dateFilter}
       GROUP BY date
       ORDER BY date DESC`,
      params
    );

    res.json(trends);
  } catch (error) {
    logger.error('Get trends error:', error);
    res.status(500).json({ message: 'Error fetching trends' });
  }
});

// Get category spending
router.get('/categories', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const { start_date, end_date } = req.query as AnalyticsQueryParams;

    let dateFilter = '';
    const params: any[] = [req.user.id];

    if (start_date && end_date) {
      dateFilter = 'AND e.date BETWEEN ? AND ?';
      params.push(start_date, end_date);
    }

    const categorySpending = await query<CategorySpending>(
      `SELECT c.id as category_id, c.name as category_name, c.color as category_color,
              COALESCE(SUM(e.amount), 0) as total_spent
       FROM categories c
       LEFT JOIN expenses e ON e.category_id = c.id AND e.user_id = ? ${dateFilter}
       WHERE c.user_id = ?
       GROUP BY c.id
       HAVING total_spent > 0
       ORDER BY total_spent DESC`,
      [...params, req.user.id]
    );

    res.json(categorySpending);
  } catch (error) {
    logger.error('Get category spending error:', error);
    res.status(500).json({ message: 'Error fetching category spending' });
  }
});

export default router;