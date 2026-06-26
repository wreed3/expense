import express, { Response } from 'express';
import { query } from '../utils/db.js';
import { authenticateToken } from '../middleware/auth.js';
import logger from '../utils/logger.js';
import type { AuthRequest, ExpenseWithCategory, ExpenseQueryParams } from '../types/index.js';

const router = express.Router();

// Export to CSV
router.get('/csv', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const { category_id, start_date, end_date } = req.query as ExpenseQueryParams;

    let sql = `
      SELECT e.date, e.description, e.amount, c.name as category_name
      FROM expenses e
      JOIN categories c ON e.category_id = c.id
      WHERE e.user_id = ?
    `;
    const params: any[] = [req.user.id];

    if (category_id) {
      sql += ' AND e.category_id = ?';
      params.push(parseInt(category_id));
    }

    if (start_date) {
      sql += ' AND e.date >= ?';
      params.push(start_date);
    }

    if (end_date) {
      sql += ' AND e.date <= ?';
      params.push(end_date);
    }

    sql += ' ORDER BY e.date DESC';

    const expenses = await query<ExpenseWithCategory>(sql, params);

    // Generate CSV
    const csvHeader = 'Date,Description,Amount,Category\n';
    const csvRows = expenses
      .map(
        (expense) =>
          `${expense.date},"${expense.description}",${expense.amount},"${expense.category_name}"`
      )
      .join('\n');

    const csv = csvHeader + csvRows;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=expenses.csv');
    res.send(csv);

    logger.info('CSV export completed:', { userId: req.user.id, count: expenses.length });
  } catch (error) {
    logger.error('CSV export error:', error);
    res.status(500).json({ message: 'Error exporting to CSV' });
  }
});

// Export to PDF (simplified - would use a PDF library in production)
router.get('/pdf', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const { category_id, start_date, end_date } = req.query as ExpenseQueryParams;

    let sql = `
      SELECT e.date, e.description, e.amount, c.name as category_name
      FROM expenses e
      JOIN categories c ON e.category_id = c.id
      WHERE e.user_id = ?
    `;
    const params: any[] = [req.user.id];

    if (category_id) {
      sql += ' AND e.category_id = ?';
      params.push(parseInt(category_id));
    }

    if (start_date) {
      sql += ' AND e.date >= ?';
      params.push(start_date);
    }

    if (end_date) {
      sql += ' AND e.date <= ?';
      params.push(end_date);
    }

    sql += ' ORDER BY e.date DESC';

    const expenses = await query<ExpenseWithCategory>(sql, params);

    // Calculate totals
    const total = expenses.reduce((sum, expense) => sum + expense.amount, 0);

    // Generate simple HTML that can be converted to PDF client-side
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Expense Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #333; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
            th { background-color: #f5f5f5; font-weight: bold; }
            .total { font-weight: bold; font-size: 1.2em; margin-top: 20px; }
          </style>
        </head>
        <body>
          <h1>Expense Report</h1>
          <p>Generated: ${new Date().toLocaleDateString()}</p>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Description</th>
                <th>Category</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              ${expenses
                .map(
                  (expense) => `
                <tr>
                  <td>${expense.date}</td>
                  <td>${expense.description}</td>
                  <td>${expense.category_name}</td>
                  <td>$${expense.amount.toFixed(2)}</td>
                </tr>
              `
                )
                .join('')}
            </tbody>
          </table>
          <div class="total">Total: $${total.toFixed(2)}</div>
        </body>
      </html>
    `;

    res.setHeader('Content-Type', 'text/html');
    res.send(html);

    logger.info('PDF export completed:', { userId: req.user.id, count: expenses.length });
  } catch (error) {
    logger.error('PDF export error:', error);
    res.status(500).json({ message: 'Error exporting to PDF' });
  }
});

export default router;