import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { z } from 'zod';
import { getDb } from '../utils/db.js';
import { authenticate } from '../middleware/auth.js';
import { logger } from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, process.env.UPLOAD_DIR || path.join(__dirname, '../../uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880') // 5MB default
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only images (JPEG, PNG) and PDFs are allowed'));
    }
  }
});

const expenseSchema = z.object({
  amount: z.number().positive(),
  description: z.string().min(1),
  category_id: z.number().int().positive(),
  date: z.string(),
  notes: z.string().optional()
});

// Get all expenses
router.get('/', authenticate, (req, res, next) => {
  try {
    const db = getDb();
    const { start_date, end_date, category_id, search } = req.query;

    let query = `
      SELECT e.*, c.name as category_name, c.color as category_color
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

    if (search) {
      query += ' AND (e.description LIKE ? OR e.notes LIKE ?)';
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern);
    }

    query += ' ORDER BY e.date DESC, e.created_at DESC';

    const expenses = db.prepare(query).all(...params);
    res.json(expenses);
  } catch (error) {
    next(error);
  }
});

// Get single expense
router.get('/:id', authenticate, (req, res, next) => {
  try {
    const db = getDb();
    const expense = db.prepare(`
      SELECT e.*, c.name as category_name, c.color as category_color
      FROM expenses e
      JOIN categories c ON e.category_id = c.id
      WHERE e.id = ? AND e.user_id = ?
    `).get(req.params.id, req.userId) as any;

    if (!expense) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    res.json(expense);
  } catch (error) {
    next(error);
  }
});

// Create expense
router.post('/', authenticate, (req, res, next) => {
  try {
    const data = expenseSchema.parse(req.body);
    const db = getDb();

    // Verify category belongs to user
    const category = db.prepare(
      'SELECT id FROM categories WHERE id = ? AND user_id = ?'
    ).get(data.category_id, req.userId);

    if (!category) {
      return res.status(400).json({ error: 'Invalid category' });
    }

    const result = db.prepare(`
      INSERT INTO expenses (user_id, amount, description, category_id, date, notes)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      req.userId,
      data.amount,
      data.description,
      data.category_id,
      data.date,
      data.notes || null
    );

    const expense = db.prepare(`
      SELECT e.*, c.name as category_name, c.color as category_color
      FROM expenses e
      JOIN categories c ON e.category_id = c.id
      WHERE e.id = ?
    `).get(result.lastInsertRowid) as any;

    logger.info(`Expense created: ${expense.id} by user ${req.userId}`);
    res.status(201).json(expense);
  } catch (error) {
    next(error);
  }
});

// Update expense
router.put('/:id', authenticate, (req, res, next) => {
  try {
    const data = expenseSchema.parse(req.body);
    const db = getDb();

    // Verify expense belongs to user
    const existing = db.prepare(
      'SELECT id FROM expenses WHERE id = ? AND user_id = ?'
    ).get(req.params.id, req.userId);

    if (!existing) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    // Verify category belongs to user
    const category = db.prepare(
      'SELECT id FROM categories WHERE id = ? AND user_id = ?'
    ).get(data.category_id, req.userId);

    if (!category) {
      return res.status(400).json({ error: 'Invalid category' });
    }

    db.prepare(`
      UPDATE expenses
      SET amount = ?, description = ?, category_id = ?, date = ?, notes = ?
      WHERE id = ? AND user_id = ?
    `).run(
      data.amount,
      data.description,
      data.category_id,
      data.date,
      data.notes || null,
      req.params.id,
      req.userId
    );

    const expense = db.prepare(`
      SELECT e.*, c.name as category_name, c.color as category_color
      FROM expenses e
      JOIN categories c ON e.category_id = c.id
      WHERE e.id = ?
    `).get(req.params.id) as any;

    logger.info(`Expense updated: ${expense.id} by user ${req.userId}`);
    res.json(expense);
  } catch (error) {
    next(error);
  }
});

// Delete expense
router.delete('/:id', authenticate, (req, res, next) => {
  try {
    const db = getDb();

    const result = db.prepare(
      'DELETE FROM expenses WHERE id = ? AND user_id = ?'
    ).run(req.params.id, req.userId);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    logger.info(`Expense deleted: ${req.params.id} by user ${req.userId}`);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

// Upload receipt
router.post('/:id/receipt', authenticate, upload.single('receipt'), (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const db = getDb();

    // Verify expense belongs to user
    const expense = db.prepare(
      'SELECT id FROM expenses WHERE id = ? AND user_id = ?'
    ).get(req.params.id, req.userId);

    if (!expense) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    const receiptPath = `/uploads/${req.file.filename}`;

    db.prepare(
      'UPDATE expenses SET receipt_path = ? WHERE id = ?'
    ).run(receiptPath, req.params.id);

    logger.info(`Receipt uploaded for expense: ${req.params.id}`);
    res.json({ receipt_path: receiptPath });
  } catch (error) {
    next(error);
  }
});

export default router;