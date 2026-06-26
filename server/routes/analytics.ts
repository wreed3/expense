import { Router } from 'express';
import { db } from '../db';
import { authenticate } from '../middleware/auth';

const router = Router();

// Get spending summary
router.get('/summary', authenticate, async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    
    let query = `
      SELECT 
        COUNT(*) as total_expenses,
        SUM(amount) as total_amount,
        AVG(amount) as average_amount,
        MAX(amount) as max_amount,
        MIN(amount) as min_amount
      FROM expenses
      WHERE user_id = ?
    `;
    const params: any[] = [req.user!.id];
    
    if (startDate) {
      query += ' AND date >= ?';
      params.push(startDate);
    }
    
    if (endDate) {
      query += ' AND date <= ?';
      params.push(endDate);
    }
    
    const summary = db.prepare(query).get(...params);
    res.json(summary);
  } catch (error) {
    next(error);
  }
});

// Get spending trends
router.get('/trends', authenticate, async (req, res, next) => {
  try {
    const { period = 'month' } = req.query;
    
    let dateFormat = '%Y-%m';
    if (period === 'day') dateFormat = '%Y-%m-%d';
    if (period === 'year') dateFormat = '%Y';
    
    const trends = db.prepare(`
      SELECT 
        strftime('${dateFormat}', date) as period,
        COUNT(*) as count,
        SUM(amount) as total,
        AVG(amount) as average
      FROM expenses
      WHERE user_id = ?
      GROUP BY period
      ORDER BY period DESC
      LIMIT 12
    `).all(req.user!.id);
    
    res.json(trends);
  } catch (error) {
    next(error);
  }
});

// Get category breakdown
router.get('/categories', authenticate, async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    
    let query = `
      SELECT 
        c.id,
        c.name,
        c.color,
        COUNT(e.id) as count,
        SUM(e.amount) as total,
        AVG(e.amount) as average
      FROM categories c
      LEFT JOIN expenses e ON c.id = e.category_id AND e.user_id = ?
    `;
    const params: any[] = [req.user!.id];
    
    if (startDate || endDate) {
      query += ' WHERE';
      if (startDate) {
        query += ' e.date >= ?';
        params.push(startDate);
      }
      if (endDate) {
        if (startDate) query += ' AND';
        query += ' e.date <= ?';
        params.push(endDate);
      }
    }
    
    query += ' GROUP BY c.id ORDER BY total DESC';
    
    const breakdown = db.prepare(query).all(...params);
    res.json(breakdown);
  } catch (error) {
    next(error);
  }
});

// Get budget vs actual
router.get('/budget-comparison', authenticate, async (req, res, next) => {
  try {
    const { month } = req.query;
    
    if (!month) {
      return res.status(400).json({ message: 'Month parameter is required (YYYY-MM)' });
    }
    
    const comparison = db.prepare(`
      SELECT 
        c.id,
        c.name,
        c.color,
        b.amount as budget,
        COALESCE(SUM(e.amount), 0) as actual,
        b.amount - COALESCE(SUM(e.amount), 0) as remaining
      FROM categories c
      LEFT JOIN budgets b ON c.id = b.category_id AND b.month = ? AND b.user_id = ?
      LEFT JOIN expenses e ON c.id = e.category_id 
        AND strftime('%Y-%m', e.date) = ? 
        AND e.user_id = ?
      WHERE c.user_id = ?
      GROUP BY c.id
      HAVING b.amount IS NOT NULL
      ORDER BY c.name
    `).all(month, req.user!.id, month, req.user!.id, req.user!.id);
    
    res.json(comparison);
  } catch (error) {
    next(error);
  }
});

export default router;