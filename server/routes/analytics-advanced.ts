import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { getDatabase } from '../index.js';
import { startOfMonth, endOfMonth, subMonths, format, eachDayOfInterval, startOfDay, endOfDay } from 'date-fns';

const router = express.Router();

// Spending trends with forecasting
router.get('/trends', authenticateToken, (req, res) => {
  try {
    const { months = 12 } = req.query;
    const db = getDatabase();
    
    const monthsBack = parseInt(months as string);
    const startDate = subMonths(new Date(), monthsBack);
    
    // Get monthly spending
    const monthlyData = db.prepare(`
      SELECT 
        strftime('%Y-%m', date) as month,
        SUM(amount) as total,
        AVG(amount) as average,
        COUNT(*) as count,
        MIN(amount) as min,
        MAX(amount) as max
      FROM expenses
      WHERE user_id = ? AND date >= ?
      GROUP BY strftime('%Y-%m', date)
      ORDER BY month ASC
    `).all(req.user!.id, startDate.toISOString());

    // Calculate trend (simple linear regression)
    const values = (monthlyData as any[]).map(d => d.total);
    const n = values.length;
    
    if (n === 0) {
      return res.json({
        historical: [],
        forecast: [],
        trend: 'stable',
        trendPercentage: '0.00',
      });
    }

    const xSum = (n * (n + 1)) / 2;
    const ySum = values.reduce((a, b) => a + b, 0);
    const xySum = values.reduce((sum, y, i) => sum + (i + 1) * y, 0);
    const x2Sum = (n * (n + 1) * (2 * n + 1)) / 6;
    
    const slope = n > 1 ? (n * xySum - xSum * ySum) / (n * x2Sum - xSum * xSum) : 0;
    const intercept = (ySum - slope * xSum) / n;
    
    // Forecast next 3 months
    const forecast = [];
    for (let i = 1; i <= 3; i++) {
      const futureMonth = format(new Date(Date.now() + i * 30 * 24 * 60 * 60 * 1000), 'yyyy-MM');
      forecast.push({
        month: futureMonth,
        predicted: Math.max(0, slope * (n + i) + intercept),
      });
    }

    res.json({
      historical: monthlyData,
      forecast,
      trend: slope > 0 ? 'increasing' : slope < 0 ? 'decreasing' : 'stable',
      trendPercentage: n > 1 ? ((slope / (ySum / n)) * 100).toFixed(2) : '0.00',
    });
  } catch (error) {
    console.error('Error fetching spending trends:', error);
    res.status(500).json({ error: 'Failed to fetch spending trends' });
  }
});

// Category comparison over time
router.get('/category-comparison', authenticateToken, (req, res) => {
  try {
    const { start_date, end_date, top = 5 } = req.query;
    const db = getDatabase();
    
    const topN = parseInt(top as string);
    
    // Get top categories by total spending
    const topCategories = db.prepare(`
      SELECT 
        c.id,
        c.name,
        c.color,
        SUM(e.amount) as total
      FROM expenses e
      JOIN categories c ON e.category_id = c.id
      WHERE e.user_id = ? 
        AND e.date >= ? 
        AND e.date <= ?
      GROUP BY c.id
      ORDER BY total DESC
      LIMIT ?
    `).all(req.user!.id, start_date, end_date, topN);

    // Get monthly breakdown for each top category
    const categoryTrends = (topCategories as any[]).map(cat => {
      const monthlyData = db.prepare(`
        SELECT 
          strftime('%Y-%m', date) as month,
          SUM(amount) as amount
        FROM expenses
        WHERE user_id = ? AND category_id = ? AND date >= ? AND date <= ?
        GROUP BY strftime('%Y-%m', date)
        ORDER BY month ASC
      `).all(req.user!.id, cat.id, start_date, end_date);

      return {
        category_id: cat.id,
        category_name: cat.name,
        color: cat.color,
        total: cat.total,
        monthly: monthlyData,
      };
    });

    res.json(categoryTrends);
  } catch (error) {
    console.error('Error fetching category comparison:', error);
    res.status(500).json({ error: 'Failed to fetch category comparison' });
  }
});

// Budget performance analysis
router.get('/budget-performance', authenticateToken, (req, res) => {
  try {
    const db = getDatabase();
    const now = new Date();
    const startDate = startOfMonth(now);
    const endDate = endOfMonth(now);
    
    const performance = db.prepare(`
      SELECT 
        b.id as budget_id,
        b.amount as budget_amount,
        c.id as category_id,
        c.name as category_name,
        c.color as category_color,
        COALESCE(SUM(e.amount), 0) as spent,
        b.amount - COALESCE(SUM(e.amount), 0) as remaining,
        ROUND((COALESCE(SUM(e.amount), 0) / b.amount) * 100, 2) as percentage,
        COUNT(e.id) as expense_count
      FROM budgets b
      JOIN categories c ON b.category_id = c.id
      LEFT JOIN expenses e ON e.category_id = c.id 
        AND e.user_id = b.user_id
        AND e.date >= ?
        AND e.date <= ?
      WHERE b.user_id = ? AND b.period = 'monthly'
      GROUP BY b.id, c.id
      ORDER BY percentage DESC
    `).all(startDate.toISOString(), endDate.toISOString(), req.user!.id);

    const summary = {
      total_budgets: performance.length,
      over_budget: (performance as any[]).filter(p => p.percentage > 100).length,
      near_limit: (performance as any[]).filter(p => p.percentage > 80 && p.percentage <= 100).length,
      on_track: (performance as any[]).filter(p => p.percentage <= 80).length,
      total_budget: (performance as any[]).reduce((sum, p) => sum + p.budget_amount, 0),
      total_spent: (performance as any[]).reduce((sum, p) => sum + p.spent, 0),
    };

    res.json({ performance, summary });
  } catch (error) {
    console.error('Error fetching budget performance:', error);
    res.status(500).json({ error: 'Failed to fetch budget performance' });
  }
});

// Spending heatmap
router.get('/heatmap', authenticateToken, (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    const db = getDatabase();
    
    const dailySpending = db.prepare(`
      SELECT 
        DATE(date) as date,
        SUM(amount) as total,
        COUNT(*) as count
      FROM expenses
      WHERE user_id = ? AND date >= ? AND date <= ?
      GROUP BY DATE(date)
      ORDER BY date ASC
    `).all(req.user!.id, start_date, end_date);

    res.json(dailySpending);
  } catch (error) {
    console.error('Error fetching heatmap data:', error);
    res.status(500).json({ error: 'Failed to fetch heatmap data' });
  }
});

// Top expenses
router.get('/top-expenses', authenticateToken, (req, res) => {
  try {
    const { start_date, end_date, limit = 10 } = req.query;
    const db = getDatabase();
    
    const topExpenses = db.prepare(`
      SELECT 
        e.*,
        c.name as category_name,
        c.color as category_color
      FROM expenses e
      JOIN categories c ON e.category_id = c.id
      WHERE e.user_id = ? AND e.date >= ? AND e.date <= ?
      ORDER BY e.amount DESC
      LIMIT ?
    `).all(req.user!.id, start_date, end_date, parseInt(limit as string));

    res.json(topExpenses);
  } catch (error) {
    console.error('Error fetching top expenses:', error);
    res.status(500).json({ error: 'Failed to fetch top expenses' });
  }
});

// Month-over-month comparison
router.get('/month-comparison', authenticateToken, (req, res) => {
  try {
    const db = getDatabase();
    const now = new Date();
    const currentStart = startOfMonth(now);
    const currentEnd = endOfMonth(now);
    const previousStart = startOfMonth(subMonths(now, 1));
    const previousEnd = endOfMonth(subMonths(now, 1));
    
    const currentMonth = db.prepare(`
      SELECT 
        COUNT(*) as expense_count,
        SUM(amount) as total_spent,
        AVG(amount) as avg_expense
      FROM expenses
      WHERE user_id = ? AND date >= ? AND date <= ?
    `).get(req.user!.id, currentStart.toISOString(), currentEnd.toISOString());

    const previousMonth = db.prepare(`
      SELECT 
        COUNT(*) as expense_count,
        SUM(amount) as total_spent,
        AVG(amount) as avg_expense
      FROM expenses
      WHERE user_id = ? AND date >= ? AND date <= ?
    `).get(req.user!.id, previousStart.toISOString(), previousEnd.toISOString());

    const calculateChange = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? '+100.00' : '0.00';
      const change = ((current - previous) / previous) * 100;
      return (change > 0 ? '+' : '') + change.toFixed(2);
    };

    res.json({
      current_month: currentMonth,
      previous_month: previousMonth,
      changes: {
        expense_count: calculateChange(
          (currentMonth as any).expense_count,
          (previousMonth as any).expense_count
        ),
        total_spent: calculateChange(
          (currentMonth as any).total_spent || 0,
          (previousMonth as any).total_spent || 0
        ),
        avg_expense: calculateChange(
          (currentMonth as any).avg_expense || 0,
          (previousMonth as any).avg_expense || 0
        ),
      },
    });
  } catch (error) {
    console.error('Error fetching month comparison:', error);
    res.status(500).json({ error: 'Failed to fetch month comparison' });
  }
});

// Smart insights
router.get('/insights', authenticateToken, (req, res) => {
  try {
    const db = getDatabase();
    const insights = [];
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    // Check for unusual high spending
    const avgExpense = db.prepare(`
      SELECT AVG(amount) as avg FROM expenses WHERE user_id = ?
    `).get(req.user!.id);

    const highExpenses = db.prepare(`
      SELECT COUNT(*) as count FROM expenses 
      WHERE user_id = ? AND amount > ? * 2 AND date >= ?
    `).get(req.user!.id, (avgExpense as any).avg, monthStart.toISOString());

    if ((highExpenses as any).count > 0) {
      insights.push({
        type: 'warning',
        title: 'Unusual High Spending',
        message: `You have ${(highExpenses as any).count} expense(s) this month that are significantly higher than your average.`,
        icon: '⚠️',
      });
    }

    // Check budget status
    const overBudget = db.prepare(`
      SELECT COUNT(*) as count FROM budgets b
      JOIN (
        SELECT category_id, SUM(amount) as spent
        FROM expenses
        WHERE user_id = ? AND date >= ? AND date <= ?
        GROUP BY category_id
      ) e ON b.category_id = e.category_id
      WHERE b.user_id = ? AND e.spent > b.amount
    `).get(req.user!.id, monthStart.toISOString(), monthEnd.toISOString(), req.user!.id);

    if ((overBudget as any).count > 0) {
      insights.push({
        type: 'alert',
        title: 'Budget Exceeded',
        message: `You have exceeded ${(overBudget as any).count} budget(s) this month.`,
        icon: '🚨',
      });
    }

    // Most frequent category
    const topCategory = db.prepare(`
      SELECT c.name, COUNT(*) as count
      FROM expenses e
      JOIN categories c ON e.category_id = c.id
      WHERE e.user_id = ? AND e.date >= ?
      GROUP BY c.id
      ORDER BY count DESC
      LIMIT 1
    `).get(req.user!.id, monthStart.toISOString());

    if (topCategory) {
      insights.push({
        type: 'info',
        title: 'Most Frequent Category',
        message: `You've spent most frequently on ${(topCategory as any).name} with ${(topCategory as any).count} transactions this month.`,
        icon: '📊',
      });
    }

    // Spending trend
    const thisMonth = db.prepare(`
      SELECT SUM(amount) as total FROM expenses 
      WHERE user_id = ? AND date >= ? AND date <= ?
    `).get(req.user!.id, monthStart.toISOString(), monthEnd.toISOString());

    const lastMonth = db.prepare(`
      SELECT SUM(amount) as total FROM expenses 
      WHERE user_id = ? AND date >= ? AND date <= ?
    `).get(
      req.user!.id,
      startOfMonth(subMonths(now, 1)).toISOString(),
      endOfMonth(subMonths(now, 1)).toISOString()
    );

    if ((thisMonth as any).total && (lastMonth as any).total) {
      const change = (((thisMonth as any).total - (lastMonth as any).total) / (lastMonth as any).total) * 100;
      if (Math.abs(change) > 20) {
        insights.push({
          type: change > 0 ? 'warning' : 'success',
          title: 'Spending Trend',
          message: `Your spending has ${change > 0 ? 'increased' : 'decreased'} by ${Math.abs(change).toFixed(1)}% compared to last month.`,
          icon: change > 0 ? '📈' : '📉',
        });
      }
    }

    // Small expenses add up
    const smallExpenses = db.prepare(`
      SELECT COUNT(*) as count, SUM(amount) as total
      FROM expenses
      WHERE user_id = ? AND amount < 10 AND date >= ?
    `).get(req.user!.id, monthStart.toISOString());

    if ((smallExpenses as any).count > 10) {
      insights.push({
        type: 'tip',
        title: 'Small Expenses Add Up',
        message: `You have ${(smallExpenses as any).count} small expenses totaling $${((smallExpenses as any).total).toFixed(2)} this month.`,
        icon: '💡',
      });
    }

    res.json(insights);
  } catch (error) {
    console.error('Error generating insights:', error);
    res.status(500).json({ error: 'Failed to generate insights' });
  }
});

export default router;