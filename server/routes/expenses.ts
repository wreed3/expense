import express from 'express';
import { z } from 'zod';
import multer from 'multer';
import { db } from '../index.js';
import { authenticate } from '../middleware/auth.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: './uploads/',
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + '.' + file.originalname.split('.').pop());
  }
});

const upload = multer({
  storage,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880') },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

// Validation schemas
const expenseSchema = z.object({
  amount: z.number().positive(),
  currency: z.string().length(3).optional(),
  description: z.string().min(1).max(500),
  category_id: z.number().int().positive(),
  date: z.string().datetime(),
  notes: z.string().max(1000).optional(),
  tags: z.array(z.string()).optional(),
  custom_fields: z.record(z.any()).optional()
});

const searchSchema = z.object({
  query: z.string().optional(),
  category_id: z.number().int().positive().optional(),
  min_amount: z.number().positive().optional(),
  max_amount: z.number().positive().optional(),
  start_date: z.string().datetime().optional(),
  end_date: z.string().datetime().optional(),
  tags: z.array(z.string()).optional(),
  currency: z.string().length(3).optional(),
  sort_by: z.enum(['date', 'amount', 'description']).optional(),
  sort_order: z.enum(['asc', 'desc']).optional(),
  page: z.number().int().positive().optional(),
  limit: z.number().int().positive().max(100).optional()
});

// Get all expenses with advanced filtering
router.get('/', authenticate, async (req, res) => {
  try {
    const userId = req.user!.id;
    const filters = searchSchema.parse({
      ...req.query,
      category_id: req.query.category_id ? parseInt(req.query.category_id as string) : undefined,
      min_amount: req.query.min_amount ? parseFloat(req.query.min_amount as string) : undefined,
      max_amount: req.query.max_amount ? parseFloat(req.query.max_amount as string) : undefined,
      tags: req.query.tags ? JSON.parse(req.query.tags as string) : undefined,
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 50
    });

    let query = `
      SELECT e.*, c.name as category_name, c.color as category_color
      FROM expenses e
      LEFT JOIN categories c ON e.category_id = c.id
      WHERE e.user_id = ?
    `;
    const params: any[] = [userId];

    if (filters.query) {
      query += ` AND (e.description LIKE ? OR e.notes LIKE ?)`;
      params.push(`%${filters.query}%`, `%${filters.query}%`);
    }

    if (filters.category_id) {
      query += ` AND e.category_id = ?`;
      params.push(filters.category_id);
    }

    if (filters.min_amount) {
      query += ` AND e.amount >= ?`;
      params.push(filters.min_amount);
    }

    if (filters.max_amount) {
      query += ` AND e.amount <= ?`;
      params.push(filters.max_amount);
    }

    if (filters.start_date) {
      query += ` AND e.date >= ?`;
      params.push(filters.start_date);
    }

    if (filters.end_date) {
      query += ` AND e.date <= ?`;
      params.push(filters.end_date);
    }

    if (filters.currency) {
      query += ` AND e.currency = ?`;
      params.push(filters.currency);
    }

    if (filters.tags && filters.tags.length > 0) {
      query += ` AND e.id IN (
        SELECT expense_id FROM expense_tags
        WHERE tag_id IN (SELECT id FROM tags WHERE name IN (${filters.tags.map(() => '?').join(',')}))
        GROUP BY expense_id
        HAVING COUNT(DISTINCT tag_id) = ?
      )`;
      params.push(...filters.tags, filters.tags.length);
    }

    const sortBy = filters.sort_by || 'date';
    const sortOrder = filters.sort_order || 'desc';
    query += ` ORDER BY e.${sortBy} ${sortOrder}`;

    const offset = ((filters.page || 1) - 1) * (filters.limit || 50);
    query += ` LIMIT ? OFFSET ?`;
    params.push(filters.limit || 50, offset);

    const expenses = db.prepare(query).all(...params);

    // Get tags for each expense
    const expensesWithTags = expenses.map((expense: any) => {
      const tags = db.prepare(`
        SELECT t.name FROM tags t
        JOIN expense_tags et ON t.id = et.tag_id
        WHERE et.expense_id = ?
      `).all(expense.id).map((t: any) => t.name);

      return {
        ...expense,
        tags,
        custom_fields: expense.custom_fields ? JSON.parse(expense.custom_fields) : {}
      };
    });

    // Get total count for pagination
    let countQuery = `SELECT COUNT(*) as total FROM expenses e WHERE e.user_id = ?`;
    const countParams: any[] = [userId];

    if (filters.query) {
      countQuery += ` AND (e.description LIKE ? OR e.notes LIKE ?)`;
      countParams.push(`%${filters.query}%`, `%${filters.query}%`);
    }

    if (filters.category_id) {
      countQuery += ` AND e.category_id = ?`;
      countParams.push(filters.category_id);
    }

    if (filters.min_amount) {
      countQuery += ` AND e.amount >= ?`;
      countParams.push(filters.min_amount);
    }

    if (filters.max_amount) {
      countQuery += ` AND e.amount <= ?`;
      countParams.push(filters.max_amount);
    }

    if (filters.start_date) {
      countQuery += ` AND e.date >= ?`;
      countParams.push(filters.start_date);
    }

    if (filters.end_date) {
      countQuery += ` AND e.date <= ?`;
      countParams.push(filters.end_date);
    }

    if (filters.currency) {
      countQuery += ` AND e.currency = ?`;
      countParams.push(filters.currency);
    }

    const { total } = db.prepare(countQuery).get(...countParams) as { total: number };

    res.json({
      expenses: expensesWithTags,
      pagination: {
        page: filters.page || 1,
        limit: filters.limit || 50,
        total,
        pages: Math.ceil(total / (filters.limit || 50))
      }
    });
  } catch (error) {
    logger.error('Error fetching expenses:', error);
    res.status(500).json({ error: 'Failed to fetch expenses' });
  }
});

// Get expense by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const userId = req.user!.id;
    const expenseId = parseInt(req.params.id);

    const expense = db.prepare(`
      SELECT e.*, c.name as category_name, c.color as category_color
      FROM expenses e
      LEFT JOIN categories c ON e.category_id = c.id
      WHERE e.id = ? AND e.user_id = ?
    `).get(expenseId, userId);

    if (!expense) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    const tags = db.prepare(`
      SELECT t.name FROM tags t
      JOIN expense_tags et ON t.id = et.tag_id
      WHERE et.expense_id = ?
    `).all(expenseId).map((t: any) => t.name);

    res.json({
      ...expense,
      tags,
      custom_fields: (expense as any).custom_fields ? JSON.parse((expense as any).custom_fields) : {}
    });
  } catch (error) {
    logger.error('Error fetching expense:', error);
    res.status(500).json({ error: 'Failed to fetch expense' });
  }
});

// Create expense
router.post('/', authenticate, upload.single('receipt'), async (req, res) => {
  try {
    const userId = req.user!.id;
    const data = expenseSchema.parse({
      ...req.body,
      amount: parseFloat(req.body.amount),
      category_id: parseInt(req.body.category_id),
      tags: req.body.tags ? JSON.parse(req.body.tags) : [],
      custom_fields: req.body.custom_fields ? JSON.parse(req.body.custom_fields) : {}
    });

    const receiptPath = req.file ? `/uploads/${req.file.filename}` : null;

    const result = db.prepare(`
      INSERT INTO expenses (user_id, amount, currency, description, category_id, date, notes, receipt_path, custom_fields)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      userId,
      data.amount,
      data.currency || 'USD',
      data.description,
      data.category_id,
      data.date,
      data.notes || null,
      receiptPath,
      JSON.stringify(data.custom_fields || {})
    );

    const expenseId = result.lastInsertRowid as number;

    // Add tags
    if (data.tags && data.tags.length > 0) {
      for (const tagName of data.tags) {
        let tag = db.prepare('SELECT id FROM tags WHERE name = ? AND user_id = ?').get(tagName, userId) as { id: number } | undefined;
        
        if (!tag) {
          const tagResult = db.prepare('INSERT INTO tags (name, user_id) VALUES (?, ?)').run(tagName, userId);
          tag = { id: tagResult.lastInsertRowid as number };
        }

        db.prepare('INSERT INTO expense_tags (expense_id, tag_id) VALUES (?, ?)').run(expenseId, tag.id);
      }
    }

    const expense = db.prepare(`
      SELECT e.*, c.name as category_name, c.color as category_color
      FROM expenses e
      LEFT JOIN categories c ON e.category_id = c.id
      WHERE e.id = ?
    `).get(expenseId);

    const tags = db.prepare(`
      SELECT t.name FROM tags t
      JOIN expense_tags et ON t.id = et.tag_id
      WHERE et.expense_id = ?
    `).all(expenseId).map((t: any) => t.name);

    res.status(201).json({
      ...expense,
      tags,
      custom_fields: data.custom_fields
    });
  } catch (error) {
    logger.error('Error creating expense:', error);
    res.status(500).json({ error: 'Failed to create expense' });
  }
});

// Update expense
router.put('/:id', authenticate, upload.single('receipt'), async (req, res) => {
  try {
    const userId = req.user!.id;
    const expenseId = parseInt(req.params.id);
    
    const existing = db.prepare('SELECT * FROM expenses WHERE id = ? AND user_id = ?').get(expenseId, userId);
    if (!existing) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    const data = expenseSchema.parse({
      ...req.body,
      amount: parseFloat(req.body.amount),
      category_id: parseInt(req.body.category_id),
      tags: req.body.tags ? JSON.parse(req.body.tags) : [],
      custom_fields: req.body.custom_fields ? JSON.parse(req.body.custom_fields) : {}
    });

    const receiptPath = req.file ? `/uploads/${req.file.filename}` : (existing as any).receipt_path;

    db.prepare(`
      UPDATE expenses
      SET amount = ?, currency = ?, description = ?, category_id = ?, date = ?, notes = ?, receipt_path = ?, custom_fields = ?
      WHERE id = ? AND user_id = ?
    `).run(
      data.amount,
      data.currency || 'USD',
      data.description,
      data.category_id,
      data.date,
      data.notes || null,
      receiptPath,
      JSON.stringify(data.custom_fields || {}),
      expenseId,
      userId
    );

    // Update tags
    db.prepare('DELETE FROM expense_tags WHERE expense_id = ?').run(expenseId);
    
    if (data.tags && data.tags.length > 0) {
      for (const tagName of data.tags) {
        let tag = db.prepare('SELECT id FROM tags WHERE name = ? AND user_id = ?').get(tagName, userId) as { id: number } | undefined;
        
        if (!tag) {
          const tagResult = db.prepare('INSERT INTO tags (name, user_id) VALUES (?, ?)').run(tagName, userId);
          tag = { id: tagResult.lastInsertRowid as number };
        }

        db.prepare('INSERT INTO expense_tags (expense_id, tag_id) VALUES (?, ?)').run(expenseId, tag.id);
      }
    }

    const expense = db.prepare(`
      SELECT e.*, c.name as category_name, c.color as category_color
      FROM expenses e
      LEFT JOIN categories c ON e.category_id = c.id
      WHERE e.id = ?
    `).get(expenseId);

    const tags = db.prepare(`
      SELECT t.name FROM tags t
      JOIN expense_tags et ON t.id = et.tag_id
      WHERE et.expense_id = ?
    `).all(expenseId).map((t: any) => t.name);

    res.json({
      ...expense,
      tags,
      custom_fields: data.custom_fields
    });
  } catch (error) {
    logger.error('Error updating expense:', error);
    res.status(500).json({ error: 'Failed to update expense' });
  }
});

// Delete expense
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const userId = req.user!.id;
    const expenseId = parseInt(req.params.id);

    const result = db.prepare('DELETE FROM expenses WHERE id = ? AND user_id = ?').run(expenseId, userId);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    // Delete associated tags
    db.prepare('DELETE FROM expense_tags WHERE expense_id = ?').run(expenseId);

    res.status(204).send();
  } catch (error) {
    logger.error('Error deleting expense:', error);
    res.status(500).json({ error: 'Failed to delete expense' });
  }
});

export default router;