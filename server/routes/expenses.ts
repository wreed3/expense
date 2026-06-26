import express from 'express';
import multer from 'multer';
import path from 'path';
import { z } from 'zod';
import { getDatabase } from '../database/index.js';
import { AppError, asyncHandler } from '../middleware/errorHandler.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { mkdirSync } from 'fs';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = process.env.UPLOAD_DIR || './uploads';
    mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880'),
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, and PDF are allowed.'));
    }
  },
});

const expenseSchema = z.object({
  categoryId: z.number(),
  amount: z.number().positive(),
  description: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  isRecurring: z.boolean().optional(),
  recurringFrequency: z.enum(['daily', 'weekly', 'monthly', 'yearly']).optional(),
});

// Get all expenses
router.get(
  '/',
  authenticate,
  asyncHandler(async (req: AuthRequest, res) => {
    const db = getDatabase();
    const { startDate, endDate, categoryId, search } = req.query;

    let query = `
      SELECT e.*, c.name as category_name, c.color as category_color
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

    if (categoryId) {
      query += ' AND e.category_id = ?';
      params.push(categoryId);
    }

    if (search) {
      query += ' AND e.description LIKE ?';
      params.push(`%${search}%`);
    }

    query += ' ORDER BY e.date DESC, e.created_at DESC';

    const expenses = db.prepare(query).all(...params);

    res.json(expenses);
  })
);

// Get single expense
router.get(
  '/:id',
  authenticate,
  asyncHandler(async (req: AuthRequest, res) => {
    const db = getDatabase();

    const expense = db
      .prepare(
        `
      SELECT e.*, c.name as category_name, c.color as category_color
      FROM expenses e
      JOIN categories c ON e.category_id = c.id
      WHERE e.id = ? AND e.user_id = ?
    `
      )
      .get(req.params.id, req.userId!);

    if (!expense) {
      throw new AppError('Expense not found', 404);
    }

    res.json(expense);
  })
);

// Create expense
router.post(
  '/',
  authenticate,
  upload.single('receipt'),
  asyncHandler(async (req: AuthRequest, res) => {
    const data = expenseSchema.parse({
      ...req.body,
      categoryId: parseInt(req.body.categoryId),
      amount: parseFloat(req.body.amount),
      isRecurring: req.body.isRecurring === 'true',
    });

    const db = getDatabase();

    // Verify category belongs to user
    const category = db
      .prepare('SELECT id FROM categories WHERE id = ? AND user_id = ?')
      .get(data.categoryId, req.userId!);

    if (!category) {
      throw new AppError('Category not found', 404);
    }

    const result = db
      .prepare(
        `
      INSERT INTO expenses (user_id, category_id, amount, description, date, receipt_path, is_recurring, recurring_frequency)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `
      )
      .run(
        req.userId!,
        data.categoryId,
        data.amount,
        data.description,
        data.date,
        req.file?.filename || null,
        data.isRecurring ? 1 : 0,
        data.recurringFrequency || null
      );

    const expense = db
      .prepare(
        `
      SELECT e.*, c.name as category_name, c.color as category_color
      FROM expenses e
      JOIN categories c ON e.category_id = c.id
      WHERE e.id = ?
    `
      )
      .get(result.lastInsertRowid);

    res.status(201).json(expense);
  })
);

// Update expense
router.put(
  '/:id',
  authenticate,
  upload.single('receipt'),
  asyncHandler(async (req: AuthRequest, res) => {
    const data = expenseSchema.parse({
      ...req.body,
      categoryId: parseInt(req.body.categoryId),
      amount: parseFloat(req.body.amount),
      isRecurring: req.body.isRecurring === 'true',
    });

    const db = getDatabase();

    // Verify expense belongs to user
    const existingExpense = db
      .prepare('SELECT * FROM expenses WHERE id = ? AND user_id = ?')
      .get(req.params.id, req.userId!) as any;

    if (!existingExpense) {
      throw new AppError('Expense not found', 404);
    }

    // Verify category belongs to user
    const category = db
      .prepare('SELECT id FROM categories WHERE id = ? AND user_id = ?')
      .get(data.categoryId, req.userId!);

    if (!category) {
      throw new AppError('Category not found', 404);
    }

    const receiptPath = req.file?.filename || existingExpense.receipt_path;

    db.prepare(
      `
      UPDATE expenses
      SET category_id = ?, amount = ?, description = ?, date = ?, receipt_path = ?, 
          is_recurring = ?, recurring_frequency = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND user_id = ?
    `
    ).run(
      data.categoryId,
      data.amount,
      data.description,
      data.date,
      receiptPath,
      data.isRecurring ? 1 : 0,
      data.recurringFrequency || null,
      req.params.id,
      req.userId!
    );

    const expense = db
      .prepare(
        `
      SELECT e.*, c.name as category_name, c.color as category_color
      FROM expenses e
      JOIN categories c ON e.category_id = c.id
      WHERE e.id = ?
    `
      )
      .get(req.params.id);

    res.json(expense);
  })
);

// Delete expense
router.delete(
  '/:id',
  authenticate,
  asyncHandler(async (req: AuthRequest, res) => {
    const db = getDatabase();

    const result = db
      .prepare('DELETE FROM expenses WHERE id = ? AND user_id = ?')
      .run(req.params.id, req.userId!);

    if (result.changes === 0) {
      throw new AppError('Expense not found', 404);
    }

    res.status(204).send();
  })
);

export default router;