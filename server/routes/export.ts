import { Router, Response } from 'express';
import { getDb } from '../utils/db.js';
import { authenticateToken } from '../middleware/auth.js';
import type { AuthRequest, ExpenseQueryParams } from '../types/express.js';

const router: Router = Router();

interface ExpenseExport {
  id: number;
  date: string;
  description: string;
  amount: number;
  category_name: string;
  is_recurring: number;
  recurring_frequency: string | null;
}

router.get('/csv', authenticateToken, (req: AuthRequest, res: Response): void => {
  try {
    const { startDate, endDate, category } = req.query as ExpenseQueryParams;
    const db = getDb();
    
    let query: string = `
      SELECT 
        e.id,
        e.date,
        e.description,
        e.amount,
        c.name as category_name,
        e.is_recurring,
        e.recurring_frequency
      FROM expenses e
      JOIN categories c ON e.category_id = c.id
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
    if (category) {
      query += ' AND c.name = ?';
      params.push(category);
    }
    
    query += ' ORDER BY e.date DESC';
    
    const expenses = db.prepare(query).all(...params) as ExpenseExport[];
    
    const csv: string = [
      'Date,Description,Amount,Category,Recurring,Frequency',
      ...expenses.map((e: ExpenseExport) => 
        `${e.date},"${e.description}",${e.amount},${e.category_name},${e.is_recurring ? 'Yes' : 'No'},${e.recurring_frequency || ''}`
      )
    ].join('\n');
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=expenses.csv');
    res.send(csv);
  } catch (error) {
    res.status(500).json({ error: 'Failed to export expenses' });
  }
});

router.get('/pdf', authenticateToken, (req: AuthRequest, res: Response): void => {
  try {
    const { startDate, endDate, category } = req.query as ExpenseQueryParams;
    const db = getDb();
    
    let query: string = `
      SELECT 
        e.date,
        e.description,
        e.amount,
        c.name as category_name
      FROM expenses e
      JOIN categories c ON e.category_id = c.id
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
    if (category) {
      query += ' AND c.name = ?';
      params.push(category);
    }
    
    query += ' ORDER BY e.date DESC';
    
    const expenses = db.prepare(query).all(...params) as ExpenseExport[];
    
    res.json({
      message: 'PDF generation should be handled on the client side using jsPDF',
      data: expenses
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch expenses for PDF' });
  }
});

export default router;