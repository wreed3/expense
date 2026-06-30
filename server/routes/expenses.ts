import { Router, Response } from 'express';
import { z } from 'zod';
import multer from 'multer';
import path from 'path';
import { getDb } from '../utils/db.js';
import { authenticateToken } from '../middleware/auth.js';
import type { AuthRequest, ExpenseBody, ExpenseQueryParams } from '../types/express.js';

const router: Router = Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, process.env.UPLOAD_DIR || './uploads');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix: string = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880') // 5MB default
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes: string[] = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

const expenseSchema = z.object({
  amount: z.number().positive(),
  category_id: z.number().int().positive(),
  description: z.string().min(1),
  date: z.string(),
  is_recurring: z.boolean().optional(),
  recurring_frequency: z.enum(['daily', 'weekly', 'monthly', 'yearly']).optional(),
});

interface Expense {
  id: number;
  user_id: number;
  amount: number;
  category_id: number;
  description: string;
  date: string;
  receipt_path: string | null;
  is_recurring: number;
  recurring_frequency: string | null;
  created_at: string;
  category_name?: string;
  category_color?: string;
  category_icon?: string;
}

router.get('/', authenticateToken, (req: AuthRequest, res: Response): void => {
  try {
    const { startDate, endDate, category, search } = req.query as ExpenseQueryParams;
    const db = getDb();
    
    let query: string = `
      SELECT e.*, c.name as category_name, c.color as category_color, c.icon as category_icon
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
    if (search) {
      query += ' AND e.description LIKE ?';
      params.push(`%${search}%`);
    }
    
    query += ' ORDER BY e.date DESC, e.created_at DESC';
    
    const expenses = db.prepare(query).all(...params) as Expense[];
    res.json(expenses);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch expenses' });
  }
});

router.post('/', authenticateToken, (req: AuthRequest, res: Response): void => {
  try {
    const expenseData = expenseSchema.parse(req.body) as ExpenseBody;
    const db = getDb();
    
    const result = db.prepare(`
      INSERT INTO expenses (user_id, amount, category_id, description, date, is_recurring, recurring_frequency)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      req.userId,
      expenseData.amount,
      expenseData.category_id,
      expenseData.description,
      expenseData.date,
      expenseData.is_recurring ? 1 : 0,
      expenseData.recurring_frequency || null
    );
    
    const expense = db.prepare(`
      SELECT e.*, c.name as category_name, c.color as category_color, c.icon as category_icon
      FROM expenses e
      JOIN categories c ON e.category_id = c.id
      WHERE e.id = ?
    `).get(result.lastInsertRowid) as Expense;
    
    res.status(201).json(expense);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors });
      return;
    }
    res.status(500).json({ error: 'Failed to create expense' });
  }
});

router.get('/:id', authenticateToken, (req: AuthRequest, res: Response): void => {
  try {
    const db = getDb();
    const expense = db.prepare(`
      SELECT e.*, c.name as category_name, c.color as category_color, c.icon as category_icon
      FROM expenses e
      JOIN categories c ON e.category_id = c.id
      WHERE e.id = ? AND e.user_id = ?
    `).get(req.params.id, req.userId) as Expense | undefined;
    
    if (!expense) {
      res.status(404).json({ error: 'Expense not found' });
      return;
    }
    
    res.json(expense);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch expense' });
  }
});

router.put('/:id', authenticateToken, (req: AuthRequest, res: Response): void => {
  try {
    const expenseData = expenseSchema.parse(req.body) as ExpenseBody;
    const db = getDb();
    
    const existing = db.prepare('SELECT id FROM expenses WHERE id = ? AND user_id = ?')
      .get(req.params.id, req.userId) as { id: number } | undefined;
    
    if (!existing) {
      res.status(404).json({ error: 'Expense not found' });
      return;
    }
    
    db.prepare(`
      UPDATE expenses
      SET amount = ?, category_id = ?, description = ?, date = ?, is_recurring = ?, recurring_frequency = ?
      WHERE id = ?
    `).run(
      expenseData.amount,
      expenseData.category_id,
      expenseData.description,
      expenseData.date,
      expenseData.is_recurring ? 1 : 0,
      expenseData.recurring_frequency || null,
      req.params.id
    );
    
    const expense = db.prepare(`
      SELECT e.*, c.name as category_name, c.color as category_color, c.icon as category_icon
      FROM expenses e
      JOIN categories c ON e.category_id = c.id
      WHERE e.id = ?
    `).get(req.params.id) as Expense;
    
    res.json(expense);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors });
      return;
    }
    res.status(500).json({ error: 'Failed to update expense' });
  }
});

router.delete('/:id', authenticateToken, (req: AuthRequest, res: Response): void => {
  try {
    const db = getDb();
    
    const existing = db.prepare('SELECT id FROM expenses WHERE id = ? AND user_id = ?')
      .get(req.params.id, req.userId) as { id: number } | undefined;
    
    if (!existing) {
      res.status(404).json({ error: 'Expense not found' });
      return;
    }
    
    db.prepare('DELETE FROM expenses WHERE id = ?').run(req.params.id);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete expense' });
  }
});

router.post('/:id/receipt', authenticateToken, upload.single('receipt'), (req: AuthRequest, res: Response): void => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }
    
    const db = getDb();
    
    const existing = db.prepare('SELECT id FROM expenses WHERE id = ? AND user_id = ?')
      .get(req.params.id, req.userId) as { id: number } | undefined;
    
    if (!existing) {
      res.status(404).json({ error: 'Expense not found' });
      return;
    }
    
    db.prepare('UPDATE expenses SET receipt_path = ? WHERE id = ?')
      .run(req.file.path, req.params.id);
    
    res.json({ receipt_path: req.file.path });
  } catch (error) {
    res.status(500).json({ error: 'Failed to upload receipt' });
  }
});

export default router;