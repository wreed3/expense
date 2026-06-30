import express from 'express';
import { getDb } from '../utils/db.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Export to CSV
router.get('/csv', authenticate, (req, res, next) => {
  try {
    const db = getDb();
    const { start_date, end_date, category_id } = req.query;

    let query = `
      SELECT 
        e.date,
        e.amount,
        e.description,
        c.name as category,
        e.notes
      FROM expenses e
      JOIN categories c ON e.category_id = c.id
      WHERE e.user_id = ?
    `;
    const params: any[] = [req.userId];

    if (start_date) {
      query += ' AND e.date >= ?';
      params.push(start_date);
    }

    if (end_date) {
      query += ' AND e.date <= ?';
      params.push(end_date);
    }

    if (category_id) {
      query += ' AND e.category_id = ?';
      params.push(category_id);
    }

    query += ' ORDER BY e.date DESC';

    const expenses = db.prepare(query).all(...params) as any[];

    // Generate CSV
    const headers = ['Date', 'Amount', 'Description', 'Category', 'Notes'];
    const csvRows = [
      headers.join(','),
      ...expenses.map(exp => [
        exp.date,
        exp.amount,
        `"${exp.description.replace(/"/g, '""')}"`,
        `"${exp.category.replace(/"/g, '""')}"`,
        exp.notes ? `"${exp.notes.replace(/"/g, '""')}"` : ''
      ].join(','))
    ];

    const csv = csvRows.join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=expenses.csv');
    res.send(csv);
  } catch (error) {
    next(error);
  }
});

// Export to PDF (placeholder - would need a PDF library)
router.get('/pdf', authenticate, (req, res, next) => {
  try {
    // This would require a PDF generation library like pdfkit or puppeteer
    res.status(501).json({ 
      error: 'PDF export not yet implemented',
      message: 'Use CSV export or implement PDF generation on the client side'
    });
  } catch (error) {
    next(error);
  }
});

export default router;