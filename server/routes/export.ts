import express from 'express';
import { getDatabase } from '../database/index.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';

const router = express.Router();

// Export to CSV
router.get(
  '/csv',
  authenticate,
  asyncHandler(async (req: AuthRequest, res) => {
    const db = getDatabase();
    const { startDate, endDate } = req.query;

    let query = `
      SELECT 
        e.date,
        e.description,
        e.amount,
        c.name as category,
        e.is_recurring,
        e.recurring_frequency
      FROM expenses e
      JOIN categories c ON e.category_id = c.id
      WHERE e.user_id = ?
    `;
    const params: any[] = [req.userId!];

    if (startDate) {
      query += ' AND e.date >= ?';
      params.push(startDate);
    }

    if (endDate) {
      query += ' AND e.date <= ?';
      params.push(endDate);
    }

    query += ' ORDER BY e.date DESC';

    const expenses = db.prepare(query).all(...params) as any[];

    // Generate CSV
    const headers = ['Date', 'Description', 'Amount', 'Category', 'Recurring', 'Frequency'];
    const csvRows = [headers.join(',')];

    for (const expense of expenses) {
      const row = [
        expense.date,
        `"${expense.description.replace(/"/g, '""')}"`,
        expense.amount,
        `"${expense.category}"`,
        expense.is_recurring ? 'Yes' : 'No',
        expense.recurring_frequency || 'N/A',
      ];
      csvRows.push(row.join(','));
    }

    const csv = csvRows.join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=expenses.csv');
    res.send(csv);
  })
);

// Generate PDF report (simplified - would need jsPDF on server or use a PDF library)
router.get(
  '/pdf',
  authenticate,
  asyncHandler(async (req: AuthRequest, res) => {
    const db = getDatabase();
    const { startDate, endDate } = req.query;

    let query = `
      SELECT 
        e.*,
        c.name as category_name,
        c.color as category_color
      FROM expenses e
      JOIN categories c ON e.category_id = c.id
      WHERE e.user_id = ?
    `;
    const params: any[] = [req.userId!];

    if (startDate) {
      query += ' AND e.date >= ?';
      params.push(startDate);
    }

    if (endDate) {
      query += ' AND e.date <= ?';
      params.push(endDate);
    }

    query += ' ORDER BY e.date DESC';

    const expenses = db.prepare(query).all(...params);

    // Get summary
    const summary = db
      .prepare(
        `
      SELECT 
        COUNT(*) as total_expenses,
        COALESCE(SUM(amount), 0) as total_amount
      FROM expenses
      WHERE user_id = ? ${startDate ? 'AND date >= ?' : ''} ${endDate ? 'AND date <= ?' : ''}
    `
      )
      .get(...params);

    // For now, return JSON data that frontend can use to generate PDF
    res.json({
      expenses,
      summary,
      dateRange: {
        start: startDate || 'All time',
        end: endDate || 'Present',
      },
    });
  })
);

export default router;