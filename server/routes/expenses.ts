import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authenticateToken } from '../middleware/auth.js';
import { cacheMiddleware, invalidateCache } from '../middleware/cache.js';
import { cacheKeys } from '../utils/cache.js';
import { getDatabase } from '../index.js';
import { z } from 'zod';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = process.env.UPLOAD_DIR || './uploads';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
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
    }
    cb(new Error('Only .png, .jpg, .jpeg and .pdf files are allowed'));
  }
});

const expenseSchema = z.object({
  description: z.string().min(1),
  amount: z.number().positive(),
  category_id: z.number().int().positive(),
  date: z.string(),
  payment_method: z.string().optional(),
  notes: z.string().optional(),
  is_recurring: z.boolean().default(false),
  recurrence_frequency: z.enum(['daily', 'weekly', 'monthly', 'yearly']).optional(),
  recurrence_end_date: z.string().optional(),
  currency_code: z.string().length(3).default('USD'),
  original_amount: z.number().positive().optional(),
  tag_ids: z.array(z.number()).optional(),
  custom_field_values: z.array(z.object({
    field_id: z.number(),
    value: z.string(),
  })).optional(),
});

// Helper functions
function getExpenseTags(db: any, expenseId: number) {
  const stmt = db.prepare(`
    SELECT t.* FROM tags t
    INNER JOIN expense_tags et ON t.id = et.tag_id
    WHERE et.expense_id = ?
  `);
  return stmt.all(expenseId);
}

function getExpenseCustomFields(db: any, expenseId: number) {
  const stmt = db.prepare(`
    SELECT cf.*, cfv.value
    FROM custom_fields cf
    LEFT JOIN expense_custom_field_values cfv 
      ON cf.id = cfv.custom_field_id AND cfv.expense_id = ?
  `);
  const fields = stmt.all(expenseId);
  return fields.map((field: any) => ({
    ...field,
    options: field.options ? JSON.parse(field.options) : undefined,
    is_required: Boolean(field.is_required),
  }));
}

function setExpenseTags(db: any, expenseId: number, tagIds: number[]) {
  // Delete existing tags
  const deleteStmt = db.prepare('DELETE FROM expense_tags WHERE expense_id = ?');
  deleteStmt.run(expenseId);

  // Insert new tags
  if (tagIds && tagIds.length > 0) {
    const insertStmt = db.prepare('INSERT INTO expense_tags (expense_id, tag_id) VALUES (?, ?)');
    for (const tagId of tagIds) {
      insertStmt.run(expenseId, tagId);
    }
  }
}

function setExpenseCustomFields(db: any, expenseId: number, customFieldValues: Array<{field_id: number, value: string}>) {
  if (!customFieldValues || customFieldValues.length === 0) return;

  const upsertStmt = db.prepare(`
    INSERT INTO expense_custom_field_values (expense_id, custom_field_id, value, updated_at)
    VALUES (?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(expense_id, custom_field_id) 
    DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP
  `);

  for (const { field_id, value } of customFieldValues) {
    upsertStmt.run(expenseId, field_id, value);
  }
}

// Get all expenses with caching
router.get('/', 
  authenticateToken,
  cacheMiddleware({ 
    ttl: 60,
    keyGenerator: (req) => {
      const query = new URLSearchParams(req.query as any).toString();
      return `${cacheKeys.expenses(req.user!.id)}:${query}`;
    }
  }),
  (req, res) => {
    try {
      const db = getDatabase();
      const { start_date, end_date, category_id, min_amount, max_amount } = req.query;

      let query = `
        SELECT 
          e.*,
          c.name as category_name,
          c.color as category_color
        FROM expenses e
        LEFT JOIN categories c ON e.category_id = c.id
        WHERE e.user_id = ?
      `;
      const params: any[] = [req.user!.id];

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
      if (min_amount) {
        query += ' AND e.amount >= ?';
        params.push(min_amount);
      }
      if (max_amount) {
        query += ' AND e.amount <= ?';
        params.push(max_amount);
      }

      query += ' ORDER BY e.date DESC, e.id DESC';

      const stmt = db.prepare(query);
      const expenses = stmt.all(...params);

      // Get tags and custom fields for each expense
      const expensesWithDetails = expenses.map((expense: any) => {
        const tags = getExpenseTags(db, expense.id);
        const customFields = getExpenseCustomFields(db, expense.id);
        
        return {
          ...expense,
          tags,
          custom_fields: customFields,
        };
      });

      res.json(expensesWithDetails);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Get single expense
router.get('/:id',
  authenticateToken,
  cacheMiddleware({ 
    ttl: 60,
    keyGenerator: (req) => cacheKeys.expense(parseInt(req.params.id))
  }),
  (req, res) => {
    try {
      const db = getDatabase();
      const stmt = db.prepare(`
        SELECT 
          e.*,
          c.name as category_name,
          c.color as category_color
        FROM expenses e
        LEFT JOIN categories c ON e.category_id = c.id
        WHERE e.id = ? AND e.user_id = ?
      `);
      
      const expense = stmt.get(req.params.id, req.user!.id);

      if (!expense) {
        return res.status(404).json({ error: 'Expense not found' });
      }

      // Get tags and custom fields
      const tags = getExpenseTags(db, expense.id);
      const customFields = getExpenseCustomFields(db, expense.id);

      res.json({
        ...expense,
        tags,
        custom_fields: customFields,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Create expense
router.post('/',
  authenticateToken,
  invalidateCache(cacheKeys.expensesPattern('*')),
  (req, res) => {
    try {
      const validatedData = expenseSchema.parse(req.body);
      const db = getDatabase();

      const stmt = db.prepare(`
        INSERT INTO expenses (
          user_id, description, amount, category_id, date, 
          payment_method, notes, is_recurring, recurrence_frequency, 
          recurrence_end_date, currency_code, original_amount
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const info = stmt.run(
        req.user!.id,
        validatedData.description,
        validatedData.amount,
        validatedData.category_id,
        validatedData.date,
        validatedData.payment_method || null,
        validatedData.notes || null,
        validatedData.is_recurring ? 1 : 0,
        validatedData.recurrence_frequency || null,
        validatedData.recurrence_end_date || null,
        validatedData.currency_code,
        validatedData.original_amount || null
      );

      const expenseId = Number(info.lastInsertRowid);

      // Set tags if provided
      if (validatedData.tag_ids) {
        setExpenseTags(db, expenseId, validatedData.tag_ids);
      }

      // Set custom fields if provided
      if (validatedData.custom_field_values) {
        setExpenseCustomFields(db, expenseId, validatedData.custom_field_values);
      }

      // Get the created expense with all details
      const getStmt = db.prepare(`
        SELECT 
          e.*,
          c.name as category_name,
          c.color as category_color
        FROM expenses e
        LEFT JOIN categories c ON e.category_id = c.id
        WHERE e.id = ?
      `);
      
      const expense = getStmt.get(expenseId);
      const tags = getExpenseTags(db, expenseId);
      const customFields = getExpenseCustomFields(db, expenseId);

      res.status(201).json({
        ...expense,
        tags,
        custom_fields: customFields,
      });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: 'Invalid expense data', details: error.errors });
      }
      res.status(500).json({ error: error.message });
    }
  }
);

// Update expense
router.put('/:id',
  authenticateToken,
  invalidateCache(cacheKeys.expensesPattern('*')),
  (req, res) => {
    try {
      const validatedData = expenseSchema.partial().parse(req.body);
      const db = getDatabase();

      // Check if expense exists and belongs to user
      const checkStmt = db.prepare('SELECT id FROM expenses WHERE id = ? AND user_id = ?');
      const exists = checkStmt.get(req.params.id, req.user!.id);

      if (!exists) {
        return res.status(404).json({ error: 'Expense not found' });
      }

      const fields: string[] = [];
      const values: any[] = [];

      if (validatedData.description !== undefined) {
        fields.push('description = ?');
        values.push(validatedData.description);
      }
      if (validatedData.amount !== undefined) {
        fields.push('amount = ?');
        values.push(validatedData.amount);
      }
      if (validatedData.category_id !== undefined) {
        fields.push('category_id = ?');
        values.push(validatedData.category_id);
      }
      if (validatedData.date !== undefined) {
        fields.push('date = ?');
        values.push(validatedData.date);
      }
      if (validatedData.payment_method !== undefined) {
        fields.push('payment_method = ?');
        values.push(validatedData.payment_method);
      }
      if (validatedData.notes !== undefined) {
        fields.push('notes = ?');
        values.push(validatedData.notes);
      }
      if (validatedData.is_recurring !== undefined) {
        fields.push('is_recurring = ?');
        values.push(validatedData.is_recurring ? 1 : 0);
      }
      if (validatedData.recurrence_frequency !== undefined) {
        fields.push('recurrence_frequency = ?');
        values.push(validatedData.recurrence_frequency);
      }
      if (validatedData.recurrence_end_date !== undefined) {
        fields.push('recurrence_end_date = ?');
        values.push(validatedData.recurrence_end_date);
      }
      if (validatedData.currency_code !== undefined) {
        fields.push('currency_code = ?');
        values.push(validatedData.currency_code);
      }
      if (validatedData.original_amount !== undefined) {
        fields.push('original_amount = ?');
        values.push(validatedData.original_amount);
      }

      if (fields.length > 0) {
        values.push(req.params.id, req.user!.id);
        const updateStmt = db.prepare(`
          UPDATE expenses
          SET ${fields.join(', ')}
          WHERE id = ? AND user_id = ?
        `);
        updateStmt.run(...values);
      }

      // Update tags if provided
      if (validatedData.tag_ids !== undefined) {
        setExpenseTags(db, Number(req.params.id), validatedData.tag_ids);
      }

      // Update custom fields if provided
      if (validatedData.custom_field_values !== undefined) {
        setExpenseCustomFields(db, Number(req.params.id), validatedData.custom_field_values);
      }

      // Get updated expense
      const getStmt = db.prepare(`
        SELECT 
          e.*,
          c.name as category_name,
          c.color as category_color
        FROM expenses e
        LEFT JOIN categories c ON e.category_id = c.id
        WHERE e.id = ?
      `);
      
      const expense = getStmt.get(req.params.id);
      const tags = getExpenseTags(db, Number(req.params.id));
      const customFields = getExpenseCustomFields(db, Number(req.params.id));

      res.json({
        ...expense,
        tags,
        custom_fields: customFields,
      });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: 'Invalid expense data', details: error.errors });
      }
      res.status(500).json({ error: error.message });
    }
  }
);

// Delete expense
router.delete('/:id',
  authenticateToken,
  invalidateCache(cacheKeys.expensesPattern('*')),
  (req, res) => {
    try {
      const db = getDatabase();
      
      // Get expense to check ownership and get receipt path
      const getStmt = db.prepare('SELECT * FROM expenses WHERE id = ? AND user_id = ?');
      const expense = getStmt.get(req.params.id, req.user!.id) as any;

      if (!expense) {
        return res.status(404).json({ error: 'Expense not found' });
      }

      // Delete receipt file if exists
      if (expense.receipt_path) {
        const receiptPath = path.join(process.cwd(), expense.receipt_path);
        if (fs.existsSync(receiptPath)) {
          fs.unlinkSync(receiptPath);
        }
      }

      // Delete expense (cascades to tags and custom fields)
      const deleteStmt = db.prepare('DELETE FROM expenses WHERE id = ? AND user_id = ?');
      deleteStmt.run(req.params.id, req.user!.id);

      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Upload receipt
router.post('/:id/receipt',
  authenticateToken,
  upload.single('receipt'),
  invalidateCache(cacheKeys.expensesPattern('*')),
  (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const db = getDatabase();
      
      // Check if expense exists and belongs to user
      const checkStmt = db.prepare('SELECT id, receipt_path FROM expenses WHERE id = ? AND user_id = ?');
      const expense = checkStmt.get(req.params.id, req.user!.id) as any;

      if (!expense) {
        // Clean up uploaded file
        fs.unlinkSync(req.file.path);
        return res.status(404).json({ error: 'Expense not found' });
      }

      // Delete old receipt if exists
      if (expense.receipt_path) {
        const oldPath = path.join(process.cwd(), expense.receipt_path);
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }

      // Update expense with new receipt path
      const receiptPath = req.file.path.replace(/\\/g, '/');
      const updateStmt = db.prepare('UPDATE expenses SET receipt_path = ? WHERE id = ?');
      updateStmt.run(receiptPath, req.params.id);

      res.json({ receipt_path: receiptPath });
    } catch (error: any) {
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      res.status(500).json({ error: error.message });
    }
  }
);

// Delete receipt
router.delete('/:id/receipt',
  authenticateToken,
  invalidateCache(cacheKeys.expensesPattern('*')),
  (req, res) => {
    try {
      const db = getDatabase();
      
      const getStmt = db.prepare('SELECT receipt_path FROM expenses WHERE id = ? AND user_id = ?');
      const expense = getStmt.get(req.params.id, req.user!.id) as any;

      if (!expense) {
        return res.status(404).json({ error: 'Expense not found' });
      }

      if (!expense.receipt_path) {
        return res.status(404).json({ error: 'No receipt found' });
      }

      // Delete file
      const receiptPath = path.join(process.cwd(), expense.receipt_path);
      if (fs.existsSync(receiptPath)) {
        fs.unlinkSync(receiptPath);
      }

      // Update database
      const updateStmt = db.prepare('UPDATE expenses SET receipt_path = NULL WHERE id = ?');
      updateStmt.run(req.params.id);

      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

export default router;