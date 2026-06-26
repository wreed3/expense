import { Router } from 'express';
import { db } from '../db';
import { authenticate } from '../middleware/auth';
import { z } from 'zod';
import multer from 'multer';
import path from 'path';
import { config } from '../config';

const router = Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, config.uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: config.maxFileSize },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Invalid file type. Only JPEG, PNG, and PDF files are allowed.'));
  }
});

const expenseSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  amount: z.number().positive('Amount must be positive'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  category_id: z.number().int().positive(),
  notes: z.string().optional(),
  is_recurring: z.boolean().optional(),
  recurring_frequency: z.enum(['daily', 'weekly', 'monthly', 'yearly']).optional(),
});

// Get all expenses for user
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { startDate, endDate, categoryId, search } = req.query;
    
    let query = `
      SELECT e.*, c.name as category_name, c.color as category_color
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
    
    if (categoryId) {
      query += ' AND e.category_id = ?';
      params.push(categoryId);
    }
    
    if (search) {
      query += ' AND (e.description LIKE ? OR e.notes LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }
    
    query += ' ORDER BY e.date DESC, e.created_at DESC';
    
    const expenses = db.prepare(query).all(...params);
    res.json(expenses);
  } catch (error) {
    next(error);
  }
});

// Get expense by ID
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const expense = db.prepare(`
      SELECT e.*, c.name as category_name, c.color as category_color
      FROM expenses e
      JOIN categories c ON e.category_id = c.id
      WHERE e.id = ? AND e.user_id = ?
    `).get(req.params.id, req.user!.id);
    
    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }
    
    res.json(expense);
  } catch (error) {
    next(error);
  }
});

// Create expense
router.post('/', authenticate, upload.single('receipt'), async (req, res, next) => {
  try {
    const body = {
      ...req.body,
      amount: parseFloat(req.body.amount),
      category_id: parseInt(req.body.category_id),
      is_recurring: req.body.is_recurring === 'true',
    };
    
    const validated = expenseSchema.parse(body);
    
    const result = db.prepare(`
      INSERT INTO expenses (
        description, amount, date, category_id, notes, 
        is_recurring, recurring_frequency, receipt_path, user_id
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      validated.description,
      validated.amount,
      validated.date,
      validated.category_id,
      validated.notes,
      validated.is_recurring || false,
      validated.recurring_frequency,
      req.file?.filename,
      req.user!.id
    );
    
    const expense = db.prepare(`
      SELECT e.*, c.name as category_name, c.color as category_color
      FROM expenses e
      JOIN categories c ON e.category_id = c.id
      WHERE e.id = ?
    `).get(result.lastInsertRowid);
    
    res.status(201).json(expense);
  } catch (error) {
    next(error);
  }
});

// Update expense
router.put('/:id', authenticate, upload.single('receipt'), async (req, res, next) => {
  try {
    const existing = db.prepare(`
      SELECT * FROM expenses 
      WHERE id = ? AND user_id = ?
    `).get(req.params.id, req.user!.id);
    
    if (!existing) {
      return res.status(404).json({ message: 'Expense not found' });
    }
    
    const body = {
      ...req.body,
      amount: parseFloat(req.body.amount),
      category_id: parseInt(req.body.category_id),
      is_recurring: req.body.is_recurring === 'true',
    };
    
    const validated = expenseSchema.parse(body);
    
    db.prepare(`
      UPDATE expenses 
      SET description = ?, amount = ?, date = ?, category_id = ?, 
          notes = ?, is_recurring = ?, recurring_frequency = ?, receipt_path = ?
      WHERE id = ? AND user_id = ?
    `).run(
      validated.description,
      validated.amount,
      validated.date,
      validated.category_id,
      validated.notes,
      validated.is_recurring || false,
      validated.recurring_frequency,
      req.file?.filename || existing.receipt_path,
      req.params.id,
      req.user!.id
    );
    
    const expense = db.prepare(`
      SELECT e.*, c.name as category_name, c.color as category_color
      FROM expenses e
      JOIN categories c ON e.category_id = c.id
      WHERE e.id = ?
    `).get(req.params.id);
    
    res.json(expense);
  } catch (error) {
    next(error);
  }
});

// Delete expense
router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    const expense = db.prepare(`
      SELECT * FROM expenses 
      WHERE id = ? AND user_id = ?
    `).get(req.params.id, req.user!.id);
    
    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }
    
    db.prepare(`
      DELETE FROM expenses 
      WHERE id = ? AND user_id = ?
    `).run(req.params.id, req.user!.id);
    
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;