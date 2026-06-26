import express, { Response } from 'express';
import { z } from 'zod';
import multer from 'multer';
import path from 'path';
import { query, get, run } from '../utils/db.js';
import { authenticateToken } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validateRequest.js';
import logger from '../utils/logger.js';
import type {
  AuthRequest,
  Expense,
  ExpenseWithCategory,
  CreateExpenseBody,
  UpdateExpenseBody,
  ExpenseQueryParams,
} from '../types/index.js';

const router = express.Router();

// File upload configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, process.env.UPLOAD_DIR || './uploads');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880'), // 5MB default
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Only images (JPEG, PNG) and PDF files are allowed'));
    }
  },
});

// Validation schemas
const createExpenseSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  description: z.string().min(1, 'Description is required'),
  category_id: z.number().int().positive('Valid category is required'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  is_recurring: z.boolean().optional(),
  recurring_frequency: z.enum(['daily', 'weekly', 'monthly', 'yearly']).optional(),
});

const updateExpenseSchema = createExpenseSchema.partial();

// Get all expenses
router.get('/', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const { category_id, start_date, end_date, search } = req.query as ExpenseQueryParams;

    let sql = `
      SELECT e.*, c.name as category_name, c.color as category_color, c.icon as category_icon
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

    if (search) {
      sql += ' AND e.description LIKE ?';
      params.push(`%${search}%`);
    }

    sql += ' ORDER BY e.date DESC, e.created_at DESC';

    const expenses = await query<ExpenseWithCategory>(sql, params);
    res.json(expenses);
  } catch (error) {
    logger.error('Get expenses error:', error);
    res.status(500).json({ message: 'Error fetching expenses' });
  }
});

// Get single expense
router.get('/:id', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const expense = await get<ExpenseWithCategory>(
      `SELECT e.*, c.name as category_name, c.color as category_color, c.icon as category_icon
       FROM expenses e
       JOIN categories c ON e.category_id = c.id
       WHERE e.id = ? AND e.user_id = ?`,
      [req.params.id, req.user.id]
    );

    if (!expense) {
      res.status(404).json({ message: 'Expense not found' });
      return;
    }

    res.json(expense);
  } catch (error) {
    logger.error('Get expense error:', error);
    res.status(500).json({ message: 'Error fetching expense' });
  }
});

// Create expense
router.post(
  '/',
  authenticateToken,
  upload.single('receipt'),
  validateRequest(createExpenseSchema),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ message: 'Not authenticated' });
        return;
      }

      const { amount, description, category_id, date, is_recurring, recurring_frequency } =
        req.body as CreateExpenseBody;

      const receiptPath = req.file ? `/uploads/${req.file.filename}` : null;

      const result = await query<Expense>(
        `INSERT INTO expenses (user_id, amount, description, category_id, date, receipt_path, is_recurring, recurring_frequency)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?) RETURNING *`,
        [
          req.user.id,
          amount,
          description,
          category_id,
          date,
          receiptPath,
          is_recurring || false,
          recurring_frequency || null,
        ]
      );

      logger.info('Expense created:', { expenseId: result[0].id, userId: req.user.id });
      res.status(201).json(result[0]);
    } catch (error) {
      logger.error('Create expense error:', error);
      res.status(500).json({ message: 'Error creating expense' });
    }
  }
);

// Update expense
router.put(
  '/:id',
  authenticateToken,
  upload.single('receipt'),
  validateRequest(updateExpenseSchema),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ message: 'Not authenticated' });
        return;
      }

      const expense = await get<Expense>(
        'SELECT * FROM expenses WHERE id = ? AND user_id = ?',
        [req.params.id, req.user.id]
      );

      if (!expense) {
        res.status(404).json({ message: 'Expense not found' });
        return;
      }

      const updates = req.body as UpdateExpenseBody;
      const receiptPath = req.file ? `/uploads/${req.file.filename}` : expense.receipt_path;

      const result = await query<Expense>(
        `UPDATE expenses
         SET amount = ?, description = ?, category_id = ?, date = ?,
             receipt_path = ?, is_recurring = ?, recurring_frequency = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ? AND user_id = ? RETURNING *`,
        [
          updates.amount ?? expense.amount,
          updates.description ?? expense.description,
          updates.category_id ?? expense.category_id,
          updates.date ?? expense.date,
          receiptPath,
          updates.is_recurring ?? expense.is_recurring,
          updates.recurring_frequency ?? expense.recurring_frequency,
          req.params.id,
          req.user.id,
        ]
      );

      logger.info('Expense updated:', { expenseId: req.params.id, userId: req.user.id });
      res.json(result[0]);
    } catch (error) {
      logger.error('Update expense error:', error);
      res.status(500).json({ message: 'Error updating expense' });
    }
  }
);

// Delete expense
router.delete('/:id', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const expense = await get<Expense>(
      'SELECT * FROM expenses WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );

    if (!expense) {
      res.status(404).json({ message: 'Expense not found' });
      return;
    }

    await run('DELETE FROM expenses WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);

    logger.info('Expense deleted:', { expenseId: req.params.id, userId: req.user.id });
    res.json({ message: 'Expense deleted successfully' });
  } catch (error) {
    logger.error('Delete expense error:', error);
    res.status(500).json({ message: 'Error deleting expense' });
  }
});

export default router;