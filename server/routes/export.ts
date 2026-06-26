import { Router } from 'express';
import { db } from '../db';
import { authenticate } from '../middleware/auth';
import { format } from 'date-fns';

const router = Router();

// Export to CSV
router.get('/csv', authenticate, async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    
    let query = `
      SELECT 
        e.date,
        e.description,
        e.amount,
        c.name as category,
        e.notes
      FROM expenses e
      JOIN categories c ON e.category_id = c.id
      WHERE e.user_id = ?
    `;
    const params: any[] = [req.user!.id];
    
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
    const headers = ['Date', 'Description', 'Amount', 'Category', 'Notes'];
    const rows = expenses.map(e => [
      e.date,
      e.description,
      e.amount.toFixed(2),
      e.category,
      e.notes || ''
    ]);
    
    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="expenses-${format(new Date(), 'yyyy-MM-dd')}.csv"`);
    res.send(csv);
  } catch (error) {
    next(error);
  }
});

// Export to PDF (placeholder - would need a PDF library)
router.get('/pdf', authenticate, async (req, res, next) => {
  try {
    res.status(501).json({ 
      message: 'PDF export not yet implemented. Please use CSV export.' 
    });
  } catch (error) {
    next(error);
  }
});

export default router;