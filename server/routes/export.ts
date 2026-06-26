import express from 'express';
import { auth } from '../middleware/auth.js';
import { getDb } from '../db.js';

const router = express.Router();

// Export expenses to CSV
router.get('/csv', auth, async (req, res) => {
  try {
    const db = getDb();
    const userId = req.userId;

    const expenses = db.prepare(`
      SELECT 
        e.*,
        c.name as category_name
      FROM expenses e
      JOIN categories c ON e.category_id = c.id
      WHERE e.user_id = ?
      ORDER BY e.date DESC
    `).all(userId);

    // Generate CSV
    const headers = ['Date', 'Description', 'Category', 'Amount', 'Recurring'];
    const rows = expenses.map((e: any) => [
      e.date,
      e.description,
      e.category_name,
      e.amount,
      e.is_recurring ? 'Yes' : 'No',
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=expenses.csv');
    res.send(csv);
  } catch (error) {
    console.error('Export CSV error:', error);
    res.status(500).json({ error: 'Failed to export CSV' });
  }
});

// Export expenses to PDF
router.get('/pdf', auth, async (req, res) => {
  try {
    // For now, return a simple response
    // In production, you'd use a library like pdfkit or puppeteer
    res.json({ message: 'PDF export endpoint - implementation pending' });
  } catch (error) {
    console.error('Export PDF error:', error);
    res.status(500).json({ error: 'Failed to export PDF' });
  }
});

export default router;