import express from 'express';
import { getDatabase } from '../database/index.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';

const router = express.Router();

// Get spending summary
router.get(
  '/summary',
  authenticate,
  asyncHandler(async (req: AuthRequest, res) => {
    const db = getDatabase();
    const { startDate, endDate } = req.query;

    let dateFilter = '';
    const params: any[] = [req.userId!];

    if (startDate && endDate) {
      dateFilter = 'AND date BETWEEN ? AND ?';
      params.push(startDate, endDate);
    }

    const summary = db
      .prepare(
        `
      SELECT 
        COUNT(*) as total_expenses,
        COALESCE(SUM(amount), 0) as total_amount,
        COALESCE(AVG(amount), 0) as average_amount,
        COALESCE(MAX(amount), 0) as max_amount,
        COALESCE(MIN(amount), 0) as min_amount
      FROM expenses
      WHERE user_id = ? ${dateFilter}
    `
      )
      .get(...params);

    res.json(summary);
  })
);

// Get spending trends
router.get(
  '/trends',
  authenticate,
  asyncHandler(async (req: AuthRequest, res) => {
    const db = getDatabase();
    const { period = 'month' } = req.query;

    let groupBy = "strftime('%Y-%m', date)";
    if (period === 'week') {
      groupBy = "strftime('%Y-W%W', date)";
    } else if (period === 'day') {
      groupBy = "date";
    }

    const trends = db
      .prepare(
        `
      SELECT 
        ${groupBy} as period,
        COUNT(*) as expense_count,
        COALESCE(SUM(amount), 0) as total_amount
      FROM expenses
      WHERE user_id = ?
      GROUP BY ${groupBy}
      ORDER BY period DESC
      LIMIT 12
    `
      )
      .all(req.userId!);

    res.json(trends.reverse());
  })
);

// Get category breakdown
router.get(
  '/categories',
  authenticate,
  asyncHandler(async (req: AuthRequest, res) => {
    const db = getDatabase();
    const { startDate, endDate } = req.query;

    let dateFilter = '';
    const params: any[] = [req.userId!];

    if (startDate && endDate) {
      dateFilter = 'AND e.date BETWEEN ? AND ?';
      params.push(startDate, endDate);
    }

    const breakdown = db
      .prepare(
        `
      SELECT 
        c.id,
        c.name,
        c.color,
        COUNT(e.id) as expense_count,
        COALESCE(SUM(e.amount), 0) as total_amount,
        COALESCE(AVG(e.amount), 0) as average_amount
      FROM categories c
      LEFT JOIN expenses e ON c.id = e.category_id ${dateFilter ? 'AND e.user_id = ?' : ''}
      WHERE c.user_id = ?
      GROUP BY c.id, c.name, c.color
      ORDER BY total_amount DESC
    `
      )
      .all(dateFilter ? req.userId! : undefined, req.userId!);

    res.json(breakdown);
  })
);

// Get top expenses
router.get(
  '/top-expenses',
  authenticate,
  asyncHandler(async (req: AuthRequest, res) => {
    const db = getDatabase();
    const { limit = 10, startDate, endDate } = req.query;

    let dateFilter = '';
    const params: any[] = [req.userId!];

    if (startDate && endDate) {
      dateFilter = 'AND date BETWEEN ? AND ?';
      params.push(startDate, endDate);
    }

    params.push(limit);

    const topExpenses = db
      .prepare(
        `
      SELECT e.*, c.name as category_name, c.color as category_color
      FROM expenses e
      JOIN categories c ON e.category_id = c.id
      WHERE e.user_id = ? ${dateFilter}
      ORDER BY e.amount DESC
      LIMIT ?
    `
      )
      .all(...params);

    res.json(topExpenses);
  })
);

// Get budget alerts
router.get(
  '/budget-alerts',
  authenticate,
  asyncHandler(async (req: AuthRequest, res) => {
    const db = getDatabase();
    const currentMonth = new Date().toISOString().slice(0, 7);

    const alerts = db
      .prepare(
        `
      SELECT 
        b.*,
        c.name as category_name,
        c.color as category_color,
        (SELECT COALESCE(SUM(amount), 0) 
         FROM expenses 
         WHERE category_id = b.category_id 
         AND strftime('%Y-%m', date) = b.month) as spent,
        CASE 
          WHEN (SELECT COALESCE(SUM(amount), 0) 
                FROM expenses 
                WHERE category_id = b.category_id 
                AND strftime('%Y-%m', date) = b.month) >= b.amount 
          THEN 'exceeded'
          WHEN (SELECT COALESCE(SUM(amount), 0) 
                FROM expenses 
                WHERE category_id = b.category_id 
                AND strftime('%Y-%m', date) = b.month) >= (b.amount * b.alert_threshold)
          THEN 'warning'
          ELSE 'ok'
        END as status
      FROM budgets b
      JOIN categories c ON b.category_id = c.id
      WHERE b.user_id = ? AND b.month = ?
      HAVING status != 'ok'
      ORDER BY spent DESC
    `
      )
      .all(req.userId!, currentMonth);

    res.json(alerts);
  })
);

export default router;