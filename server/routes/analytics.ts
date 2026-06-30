import express from 'express';
import { getDb } from '../utils/db.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Get spending summary
router.get('/summary', authenticate, (req, res, next) => {
  try {
    const db = getDb();
    const { start_date, end_date } = req.query;

    let dateFilter = '';
    const params: any[] = [req.userId];

    if (start_date && end_date) {
      dateFilter = 'AND e.date BETWEEN ? AND ?';
      params.push(start_date, end_date);
    }

    // Total spending
    const total = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total
      FROM expenses
      WHERE user_id = ? ${dateFilter}
    `).get(...params) as any;

    // Spending by category
    const byCategory = db.prepare(`
      SELECT 
        c.id,
        c.name,
        c.color,
        COALESCE(SUM(e.amount), 0) as total,
        COUNT(e.id) as count
      FROM categories c
      LEFT JOIN expenses e ON e.category_id = c.id 
        AND e.user_id = ? ${dateFilter}
      WHERE c.user_id = ?
      GROUP BY c.id
      ORDER BY total DESC
    `).all(...params, req.userId);

    // Monthly trends
    const trends = db.prepare(`
      SELECT 
        strftime('%Y-%m', date) as month,
        COALESCE(SUM(amount), 0) as total,
        COUNT(*) as count
      FROM expenses
      WHERE user_id = ? ${dateFilter}
      GROUP BY month
      ORDER BY month DESC
      LIMIT 12
    `).all(...params);

    res.json({
      total: total.total,
      byCategory,
      trends
    });
  } catch (error) {
    next(error);
  }
});

// Get spending trends
router.get('/trends', authenticate, (req, res, next) => {
  try {
    const db = getDb();
    const { period = 'month', category_id } = req.query;

    let groupBy = "strftime('%Y-%m', date)";
    if (period === 'week') {
      groupBy = "strftime('%Y-W%W', date)";
    } else if (period === 'day') {
      groupBy = "date(date)";
    }

    let categoryFilter = '';
    const params: any[] = [req.userId];

    if (category_id) {
      categoryFilter = 'AND category_id = ?';
      params.push(category_id);
    }

    const trends = db.prepare(`
      SELECT 
        ${groupBy} as period,
        COALESCE(SUM(amount), 0) as total,
        COUNT(*) as count,
        AVG(amount) as average
      FROM expenses
      WHERE user_id = ? ${categoryFilter}
      GROUP BY period
      ORDER BY period DESC
      LIMIT 30
    `).all(...params);

    res.json(trends);
  } catch (error) {
    next(error);
  }
});

// Get category breakdown
router.get('/categories', authenticate, (req, res, next) => {
  try {
    const db = getDb();
    const { start_date, end_date } = req.query;

    let dateFilter = '';
    const params: any[] = [req.userId];

    if (start_date && end_date) {
      dateFilter = 'AND e.date BETWEEN ? AND ?';
      params.push(start_date, end_date);
    }

    const categories = db.prepare(`
      SELECT 
        c.id,
        c.name,
        c.color,
        COUNT(e.id) as transaction_count,
        COALESCE(SUM(e.amount), 0) as total_spent,
        COALESCE(AVG(e.amount), 0) as avg_transaction,
        COALESCE(MIN(e.amount), 0) as min_transaction,
        COALESCE(MAX(e.amount), 0) as max_transaction
      FROM categories c
      LEFT JOIN expenses e ON e.category_id = c.id 
        AND e.user_id = ? ${dateFilter}
      WHERE c.user_id = ?
      GROUP BY c.id
      ORDER BY total_spent DESC
    `).all(...params, req.userId);

    res.json(categories);
  } catch (error) {
    next(error);
  }
});

export default router;