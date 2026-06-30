import { Router, Response } from 'express';
import { getDb } from '../utils/db.js';
import { authenticateToken } from '../middleware/auth.js';
import type { AuthRequest, AnalyticsQueryParams } from '../types/express.js';

const router: Router = Router();

interface CategorySpending {
  category_id: number;
  category_name: string;
  category_color: string;
  total: number;
  count: number;
}

interface TrendData {
  period: string;
  total: number;
}

interface SummaryData {
  total: number;
  count: number;
  average: number;
  categories: CategorySpending[];
}

router.get('/summary', authenticateToken, (req: AuthRequest, res: Response): void => {
  try {
    const { startDate, endDate } = req.query as AnalyticsQueryParams;
    const db = getDb();
    
    let query: string = `
      SELECT 
        SUM(e.amount) as total,
        COUNT(*) as count,
        AVG(e.amount) as average
      FROM expenses e
      WHERE e.user_id = ?
    `;
    const params: (string | number | undefined)[] = [req.userId];
    
    if (startDate) {
      query += ' AND e.date >= ?';
      params.push(startDate);
    }
    if (endDate) {
      query += ' AND e.date <= ?';
      params.push(endDate);
    }
    
    const summary = db.prepare(query).get(...params) as { total: number | null; count: number; average: number | null };
    
    let categoryQuery: string = `
      SELECT 
        c.id as category_id,
        c.name as category_name,
        c.color as category_color,
        SUM(e.amount) as total,
        COUNT(*) as count
      FROM expenses e
      JOIN categories c ON e.category_id = c.id
      WHERE e.user_id = ?
    `;
    const categoryParams: (string | number | undefined)[] = [req.userId];
    
    if (startDate) {
      categoryQuery += ' AND e.date >= ?';
      categoryParams.push(startDate);
    }
    if (endDate) {
      categoryQuery += ' AND e.date <= ?';
      categoryParams.push(endDate);
    }
    
    categoryQuery += ' GROUP BY c.id ORDER BY total DESC';
    
    const categories = db.prepare(categoryQuery).all(...categoryParams) as CategorySpending[];
    
    res.json({
      total: summary.total || 0,
      count: summary.count,
      average: summary.average || 0,
      categories,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch analytics summary' });
  }
});

router.get('/trends', authenticateToken, (req: AuthRequest, res: Response): void => {
  try {
    const { startDate, endDate } = req.query as AnalyticsQueryParams;
    const db = getDb();
    
    let query: string = `
      SELECT 
        strftime('%Y-%m', date) as period,
        SUM(amount) as total
      FROM expenses
      WHERE user_id = ?
    `;
    const params: (string | number | undefined)[] = [req.userId];
    
    if (startDate) {
      query += ' AND date >= ?';
      params.push(startDate);
    }
    if (endDate) {
      query += ' AND date <= ?';
      params.push(endDate);
    }
    
    query += ' GROUP BY period ORDER BY period';
    
    const trends = db.prepare(query).all(...params) as TrendData[];
    res.json(trends);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch trends' });
  }
});

router.get('/categories', authenticateToken, (req: AuthRequest, res: Response): void => {
  try {
    const { startDate, endDate } = req.query as AnalyticsQueryParams;
    const db = getDb();
    
    let query: string = `
      SELECT 
        c.id,
        c.name,
        c.color,
        c.icon,
        COUNT(e.id) as expense_count,
        COALESCE(SUM(e.amount), 0) as total_spent,
        COALESCE(AVG(e.amount), 0) as average_expense
      FROM categories c
      LEFT JOIN expenses e ON c.id = e.category_id AND e.user_id = ?
    `;
    const params: (string | number | undefined)[] = [req.userId];
    
    if (startDate) {
      query += ' AND e.date >= ?';
      params.push(startDate);
    }
    if (endDate) {
      query += ' AND e.date <= ?';
      params.push(endDate);
    }
    
    query += ' WHERE c.user_id = ? GROUP BY c.id ORDER BY total_spent DESC';
    params.push(req.userId);
    
    const categories = db.prepare(query).all(...params);
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch category analytics' });
  }
});

export default router;