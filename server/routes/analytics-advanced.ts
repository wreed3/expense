import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { getDb } from '../index';
import { startOfMonth, endOfMonth, subMonths, format, eachDayOfInterval, startOfDay, endOfDay } from 'date-fns';

const router = express.Router();

// Spending trends with forecasting
router.get('/trends', authenticateToken, (req, res) => {
  try {
    const { months = 12 } = req.query;
    const db = getDb();
    
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
      trendPercentage: n > 1 ? ((slope / (ySum / n)) * 100).toFixed(2) : 0,
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
    const db = getDb();
    
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
    const db = getDb();
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

// Spending heatmap (calendar view)
router.get('/heatmap', authenticateToken, (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    const db = getDb();
    
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

    // Fill in missing dates with zero
    const start = new Date(start_date as string);
    const end = new Date(end_date as string);
    const allDays = eachDayOfInterval({ start, end });
    
    const spendingMap = new Map((dailySpending as any[]).map(d => [d.date, d]));
    
    const heatmapData = allDays.map(day => {
      const dateStr = format(day, 'yyyy-MM-dd');
      const data = spendingMap.get(dateStr);
      return {
        date: dateStr,
        total: data?.total || 0,
        count: data?.count || 0,
        day_of_week: format(day, 'EEEE'),
      };
    });

    res.json(heatmapData);
  } catch (error) {
    console.error('Error fetching heatmap data:', error);
    res.status(500).json({ error: 'Failed to fetch heatmap data' });
  }
});

// Top expenses and categories
router.get('/top-expenses', authenticateToken, (req, res) => {
  try {
    const { start_date, end_date, limit = 10 } = req.query;
    const db = getDb();
    
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
    const db = getDb();
    const now = new Date();
    
    const currentMonth = {
      start: startOfMonth(now),
      end: endOfMonth(now),
    };
    
    const lastMonth = {
      start: startOfMonth(subMonths(now, 1)),
      end: endOfMonth(subMonths(now, 1)),
    };
    
    const getCurrentData = (start: Date, end: Date) => {
      return db.prepare(`
        SELECT 
          COUNT(*) as expense_count,
          SUM(amount) as total_spent,
          AVG(amount) as avg_expense,
          MAX(amount) as max_expense,
          MIN(amount) as min_expense
        FROM expenses
        WHERE user_id = ? AND date >= ? AND date <= ?
      `).get(req.user!.id, start.toISOString(), end.toISOString());
    };
    
    const current = getCurrentData(currentMonth.start, currentMonth.end) as any;
    const previous = getCurrentData(lastMonth.start, lastMonth.end) as any;
    
    const calculateChange = (current: number, previous: number) => {
      if (!previous) return 0;
      return ((current - previous) / previous * 100).toFixed(2);
    };
    
    const comparison = {
      current_month: {
        ...current,
        month: format(currentMonth.start, 'MMMM yyyy'),
      },
      previous_month: {
        ...previous,
        month: format(lastMonth.start, 'MMMM yyyy'),
      },
      changes: {
        expense_count: calculateChange(current.expense_count, previous.expense_count),
        total_spent: calculateChange(current.total_spent, previous.total_spent),
        avg_expense: calculateChange(current.avg_expense, previous.avg_expense),
      },
    };
    
    res.json(comparison);
  } catch (error) {
    console.error('Error fetching month comparison:', error);
    res.status(500).json({ error: 'Failed to fetch month comparison' });
  }
});

// Smart insights and recommendations
router.get('/insights', authenticateToken, (req, res) => {
  try {
    const db = getDb();
    const insights: any[] = [];
    
    // Check for unusual spending
    const avgSpending = db.prepare(`
      SELECT AVG(amount) as avg_amount
      FROM expenses
      WHERE user_id = ? AND date >= date('now', '-30 days')
    `).get(req.user!.id) as any;
    
    const recentHighExpenses = db.prepare(`
      SELECT COUNT(*) as count
      FROM expenses
      WHERE user_id = ? 
        AND date >= date('now', '-7 days')
        AND amount > ?
    `).get(req.user!.id, avgSpending.avg_amount * 2) as any;
    
    if (recentHighExpenses.count > 0) {
      insights.push({
        type: 'warning',
        title: 'Unusual High Spending',
        message: `You have ${recentHighExpenses.count} expenses in the last week that are significantly higher than your average.`,
        icon: '⚠️',
      });
    }
    
    // Check budget performance
    const overBudget = db.prepare(`
      SELECT COUNT(*) as count
      FROM budgets b
      LEFT JOIN (
        SELECT category_id, SUM(amount) as spent
        FROM expenses
        WHERE user_id = ? AND date >= date('now', 'start of month')
        GROUP BY category_id
      ) e ON b.category_id = e.category_id
      WHERE b.user_id = ? AND e.spent > b.amount
    `).get(req.user!.id, req.user!.id) as any;
    
    if (overBudget.count > 0) {
      insights.push({
        type: 'alert',
        title: 'Budget Exceeded',
        message: `You've exceeded ${overBudget.count} budget${overBudget.count > 1 ? 's' : ''} this month.`,
        icon: '🚨',
      });
    }
    
    // Check for recurring patterns
    const frequentCategories = db.prepare(`
      SELECT c.name, COUNT(*) as count
      FROM expenses e
      JOIN categories c ON e.category_id = c.id
      WHERE e.user_id = ? AND e.date >= date('now', '-30 days')
      GROUP BY c.id
      ORDER BY count DESC
      LIMIT 1
    `).get(req.user!.id) as any;
    
    if (frequentCategories) {
      insights.push({
        type: 'info',
        title: 'Most Frequent Category',
        message: `You've made ${frequentCategories.count} ${frequentCategories.name} expenses in the last 30 days.`,
        icon: '📊',
      });
    }
    
    // Check spending trend
    const trendData = db.prepare(`
      SELECT 
        strftime('%Y-%m', date) as month,
        SUM(amount) as total
      FROM expenses
      WHERE user_id = ? AND date >= date('now', '-90 days')
      GROUP BY strftime('%Y-%m', date)
      ORDER BY month ASC
    `).all(req.user!.id) as any[];
    
    if (trendData.length >= 2) {
      const latest = trendData[trendData.length - 1].total;
      const previous = trendData[trendData.length - 2].total;
      const change = ((latest - previous) / previous * 100).toFixed(0);
      
      if (Math.abs(parseFloat(change)) > 10) {
        insights.push({
          type: parseFloat(change) > 0 ? 'warning' : 'success',
          title: 'Spending Trend',
          message: `Your spending is ${parseFloat(change) > 0 ? 'up' : 'down'} ${Math.abs(parseFloat(change))}% compared to last month.`,
          icon: parseFloat(change) > 0 ? '📈' : '📉',
        });
      }
    }
    
    // Savings opportunity
    const smallExpenses = db.prepare(`
      SELECT COUNT(*) as count, SUM(amount) as total
      FROM expenses
      WHERE user_id = ? 
        AND date >= date('now', '-30 days')
        AND amount < 10
    `).get(req.user!.id) as any;
    
    if (smallExpenses.count > 20) {
      insights.push({
        type: 'tip',
        title: 'Small Expenses Add Up',
        message: `You've made ${smallExpenses.count} small purchases (under $10) totaling $${smallExpenses.total.toFixed(2)} this month.`,
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