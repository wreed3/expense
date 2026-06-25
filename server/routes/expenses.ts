import express from 'express';
import { z } from 'zod';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authenticateToken } from '../middleware/auth';
import { getDb } from '../index';

const router = express.Router();

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
    }
    cb(new Error('Only .png, .jpg, .jpeg, and .pdf files are allowed!'));
  }
});

const expenseSchema = z.object({
  amount: z.number().positive(),
  category_id: z.number().int().positive(),
  description: z.string().min(1),
  date: z.string().datetime(),
  is_recurring: z.boolean().default(false),
  recurring_frequency: z.enum(['daily', 'weekly', 'monthly', 'yearly']).nullable().default(null),
  currency_code: z.string().length(3).default('USD'),
  tags: z.array(z.number().int()).optional(),
  custom_fields: z.record(z.string(), z.any()).optional(),
});

// Enhanced search with filters
router.get('/', authenticateToken, (req, res) => {
  try {
    const {
      start_date,
      end_date,
      category_id,
      min_amount,
      max_amount,
      search,
      tags,
      currency,
      sort_by = 'date',
      sort_order = 'desc',
      limit = '100',
      offset = '0'
    } = req.query;

    const db = getDb();
    let query = `
      SELECT DISTINCT e.*, 
        c.name as category_name, 
        c.color as category_color,
        e.currency_code,
        e.original_amount,
        GROUP_CONCAT(DISTINCT t.name) as tag_names,
        GROUP_CONCAT(DISTINCT t.id) as tag_ids
      FROM expenses e
      JOIN categories c ON e.category_id = c.id
      LEFT JOIN expense_tags et ON e.id = et.expense_id
      LEFT JOIN tags t ON et.tag_id = t.id
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

    if (search) {
      query += ' AND e.description LIKE ?';
      params.push(`%${search}%`);
    }

    if (currency) {
      query += ' AND e.currency_code = ?';
      params.push(currency);
    }

    if (tags) {
      const tagIds = (tags as string).split(',').map(id => parseInt(id));
      query += ` AND e.id IN (
        SELECT expense_id FROM expense_tags 
        WHERE tag_id IN (${tagIds.map(() => '?').join(',')})
        GROUP BY expense_id
        HAVING COUNT(DISTINCT tag_id) = ?
      )`;
      params.push(...tagIds, tagIds.length);
    }

    query += ' GROUP BY e.id';

    // Sorting
    const validSortFields = ['date', 'amount', 'description', 'category_name'];
    const sortField = validSortFields.includes(sort_by as string) ? sort_by : 'date';
    const order = sort_order === 'asc' ? 'ASC' : 'DESC';
    query += ` ORDER BY ${sortField} ${order}`;

    // Pagination
    query += ' LIMIT ? OFFSET ?';
    params.push(parseInt(limit as string), parseInt(offset as string));

    const expenses = db.prepare(query).all(...params);

    // Get total count for pagination
    let countQuery = `
      SELECT COUNT(DISTINCT e.id) as total
      FROM expenses e
      LEFT JOIN expense_tags et ON e.id = et.expense_id
      WHERE e.user_id = ?
    `;
    const countParams: any[] = [req.user!.id];

    if (start_date) {
      countQuery += ' AND e.date >= ?';
      countParams.push(start_date);
    }
    if (end_date) {
      countQuery += ' AND e.date <= ?';
      countParams.push(end_date);
    }
    if (category_id) {
      countQuery += ' AND e.category_id = ?';
      countParams.push(category_id);
    }
    if (min_amount) {
      countQuery += ' AND e.amount >= ?';
      countParams.push(min_amount);
    }
    if (max_amount) {
      countQuery += ' AND e.amount <= ?';
      countParams.push(max_amount);
    }
    if (search) {
      countQuery += ' AND e.description LIKE ?';
      countParams.push(`%${search}%`);
    }
    if (currency) {
      countQuery += ' AND e.currency_code = ?';
      countParams.push(currency);
    }

    const { total } = db.prepare(countQuery).get(...countParams) as { total: number };

    // Format expenses with tags and custom fields
    const formattedExpenses = expenses.map((expense: any) => {
      const tags = expense.tag_names ? 
        expense.tag_names.split(',').map((name: string, index: number) => ({
          id: expense.tag_ids.split(',')[index],
          name
        })) : [];

      // Get custom fields for this expense
      const customFields = db.prepare(`
        SELECT cf.name, cf.field_type, ecf.value
        FROM expense_custom_fields ecf
        JOIN custom_fields cf ON ecf.custom_field_id = cf.id
        WHERE ecf.expense_id = ?
      `).all(expense.id);

      return {
        ...expense,
        tags,
        custom_fields: customFields.reduce((acc: any, field: any) => {
          acc[field.name] = field.value;
          return acc;
        }, {}),
        tag_names: undefined,
        tag_ids: undefined,
      };
    });

    res.json({
      expenses: formattedExpenses,
      pagination: {
        total,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        has_more: parseInt(offset as string) + formattedExpenses.length < total
      }
    });
  } catch (error) {
    console.error('Error fetching expenses:', error);
    res.status(500).json({ error: 'Failed to fetch expenses' });
  }
});

// Get single expense with full details
router.get('/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const db = getDb();

    const expense = db.prepare(`
      SELECT e.*, c.name as category_name, c.color as category_color
      FROM expenses e
      JOIN categories c ON e.category_id = c.id
      WHERE e.id = ? AND e.user_id = ?
    `).get(id, req.user!.id);

    if (!expense) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    // Get tags
    const tags = db.prepare(`
      SELECT t.id, t.name, t.color
      FROM tags t
      JOIN expense_tags et ON t.id = et.tag_id
      WHERE et.expense_id = ?
    `).all(id);

    // Get custom fields
    const customFields = db.prepare(`
      SELECT cf.id, cf.name, cf.field_type, ecf.value
      FROM expense_custom_fields ecf
      JOIN custom_fields cf ON ecf.custom_field_id = cf.id
      WHERE ecf.expense_id = ?
    `).all(id);

    res.json({
      ...expense,
      tags,
      custom_fields: customFields.reduce((acc: any, field: any) => {
        acc[field.name] = field.value;
        return acc;
      }, {})
    });
  } catch (error) {
    console.error('Error fetching expense:', error);
    res.status(500).json({ error: 'Failed to fetch expense' });
  }
});

// Create expense with tags and custom fields
router.post('/', authenticateToken, upload.single('receipt'), (req, res) => {
  try {
    const expenseData = {
      ...req.body,
      amount: parseFloat(req.body.amount),
      category_id: parseInt(req.body.category_id),
      is_recurring: req.body.is_recurring === 'true',
      tags: req.body.tags ? JSON.parse(req.body.tags) : undefined,
      custom_fields: req.body.custom_fields ? JSON.parse(req.body.custom_fields) : undefined,
    };

    const validatedData = expenseSchema.parse(expenseData);
    const db = getDb();

    db.prepare('BEGIN TRANSACTION').run();

    try {
      const result = db.prepare(`
        INSERT INTO expenses (
          user_id, amount, category_id, description, date, 
          receipt_path, is_recurring, recurring_frequency,
          currency_code, original_amount
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        req.user!.id,
        validatedData.amount,
        validatedData.category_id,
        validatedData.description,
        validatedData.date,
        req.file?.filename || null,
        validatedData.is_recurring ? 1 : 0,
        validatedData.recurring_frequency,
        validatedData.currency_code,
        validatedData.amount // Store original amount
      );

      const expenseId = result.lastInsertRowid;

      // Add tags
      if (validatedData.tags && validatedData.tags.length > 0) {
        const tagStmt = db.prepare('INSERT INTO expense_tags (expense_id, tag_id) VALUES (?, ?)');
        for (const tagId of validatedData.tags) {
          tagStmt.run(expenseId, tagId);
        }
      }

      // Add custom fields
      if (validatedData.custom_fields) {
        const fieldStmt = db.prepare(`
          INSERT INTO expense_custom_fields (expense_id, custom_field_id, value)
          SELECT ?, id, ? FROM custom_fields WHERE user_id = ? AND name = ?
        `);
        
        for (const [fieldName, value] of Object.entries(validatedData.custom_fields)) {
          fieldStmt.run(expenseId, String(value), req.user!.id, fieldName);
        }
      }

      db.prepare('COMMIT').run();

      const expense = db.prepare(`
        SELECT e.*, c.name as category_name, c.color as category_color
        FROM expenses e
        JOIN categories c ON e.category_id = c.id
        WHERE e.id = ?
      `).get(expenseId);

      res.status(201).json(expense);
    } catch (error) {
      db.prepare('ROLLBACK').run();
      if (req.file) {
        fs.unlinkSync(path.join(process.env.UPLOAD_DIR || './uploads', req.file.filename));
      }
      throw error;
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid expense data', details: error.errors });
    }
    console.error('Error creating expense:', error);
    res.status(500).json({ error: 'Failed to create expense' });
  }
});

// Update expense
router.put('/:id', authenticateToken, upload.single('receipt'), (req, res) => {
  try {
    const { id } = req.params;
    const expenseData = {
      ...req.body,
      amount: parseFloat(req.body.amount),
      category_id: parseInt(req.body.category_id),
      is_recurring: req.body.is_recurring === 'true',
      tags: req.body.tags ? JSON.parse(req.body.tags) : undefined,
      custom_fields: req.body.custom_fields ? JSON.parse(req.body.custom_fields) : undefined,
    };

    const validatedData = expenseSchema.parse(expenseData);
    const db = getDb();

    db.prepare('BEGIN TRANSACTION').run();

    try {
      const existing = db.prepare('SELECT * FROM expenses WHERE id = ? AND user_id = ?').get(id, req.user!.id);
      if (!existing) {
        throw new Error('Expense not found');
      }

      const result = db.prepare(`
        UPDATE expenses 
        SET amount = ?, category_id = ?, description = ?, date = ?,
            receipt_path = ?, is_recurring = ?, recurring_frequency = ?,
            currency_code = ?, original_amount = ?, updated_at = datetime('now')
        WHERE id = ? AND user_id = ?
      `).run(
        validatedData.amount,
        validatedData.category_id,
        validatedData.description,
        validatedData.date,
        req.file?.filename || (existing as any).receipt_path,
        validatedData.is_recurring ? 1 : 0,
        validatedData.recurring_frequency,
        validatedData.currency_code,
        validatedData.amount,
        id,
        req.user!.id
      );

      if (result.changes === 0) {
        throw new Error('Expense not found');
      }

      // Update tags
      db.prepare('DELETE FROM expense_tags WHERE expense_id = ?').run(id);
      if (validatedData.tags && validatedData.tags.length > 0) {
        const tagStmt = db.prepare('INSERT INTO expense_tags (expense_id, tag_id) VALUES (?, ?)');
        for (const tagId of validatedData.tags) {
          tagStmt.run(id, tagId);
        }
      }

      // Update custom fields
      db.prepare('DELETE FROM expense_custom_fields WHERE expense_id = ?').run(id);
      if (validatedData.custom_fields) {
        const fieldStmt = db.prepare(`
          INSERT INTO expense_custom_fields (expense_id, custom_field_id, value)
          SELECT ?, id, ? FROM custom_fields WHERE user_id = ? AND name = ?
        `);
        
        for (const [fieldName, value] of Object.entries(validatedData.custom_fields)) {
          fieldStmt.run(id, String(value), req.user!.id, fieldName);
        }
      }

      // Delete old receipt if new one was uploaded
      if (req.file && (existing as any).receipt_path) {
        const oldPath = path.join(process.env.UPLOAD_DIR || './uploads', (existing as any).receipt_path);
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }

      db.prepare('COMMIT').run();

      const expense = db.prepare(`
        SELECT e.*, c.name as category_name, c.color as category_color
        FROM expenses e
        JOIN categories c ON e.category_id = c.id
        WHERE e.id = ?
      `).get(id);

      res.json(expense);
    } catch (error) {
      db.prepare('ROLLBACK').run();
      if (req.file) {
        fs.unlinkSync(path.join(process.env.UPLOAD_DIR || './uploads', req.file.filename));
      }
      throw error;
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid expense data', details: error.errors });
    }
    console.error('Error updating expense:', error);
    res.status(500).json({ error: 'Failed to update expense' });
  }
});

// Delete expense
router.delete('/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const db = getDb();

    const expense = db.prepare('SELECT * FROM expenses WHERE id = ? AND user_id = ?').get(id, req.user!.id);
    if (!expense) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    db.prepare('DELETE FROM expenses WHERE id = ? AND user_id = ?').run(id, req.user!.id);

    if ((expense as any).receipt_path) {
      const receiptPath = path.join(process.env.UPLOAD_DIR || './uploads', (expense as any).receipt_path);
      if (fs.existsSync(receiptPath)) {
        fs.unlinkSync(receiptPath);
      }
    }

    res.json({ message: 'Expense deleted successfully' });
  } catch (error) {
    console.error('Error deleting expense:', error);
    res.status(500).json({ error: 'Failed to delete expense' });
  }
});

// Bulk operations
router.post('/bulk/delete', authenticateToken, (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'Invalid expense IDs' });
    }

    const db = getDb();
    const placeholders = ids.map(() => '?').join(',');
    
    const result = db.prepare(`
      DELETE FROM expenses 
      WHERE id IN (${placeholders}) AND user_id = ?
    `).run(...ids, req.user!.id);

    res.json({ 
      message: 'Expenses deleted successfully',
      deleted_count: result.changes
    });
  } catch (error) {
    console.error('Error bulk deleting expenses:', error);
    res.status(500).json({ error: 'Failed to delete expenses' });
  }
});

router.post('/bulk/tag', authenticateToken, (req, res) => {
  try {
    const { expense_ids, tag_ids } = req.body;
    
    if (!Array.isArray(expense_ids) || !Array.isArray(tag_ids)) {
      return res.status(400).json({ error: 'Invalid data format' });
    }

    const db = getDb();
    const stmt = db.prepare('INSERT OR IGNORE INTO expense_tags (expense_id, tag_id) VALUES (?, ?)');

    let added = 0;
    for (const expenseId of expense_ids) {
      for (const tagId of tag_ids) {
        const result = stmt.run(expenseId, tagId);
        if (result.changes > 0) added++;
      }
    }

    res.json({ 
      message: 'Tags added successfully',
      tags_added: added
    });
  } catch (error) {
    console.error('Error bulk tagging expenses:', error);
    res.status(500).json({ error: 'Failed to add tags' });
  }
});

export default router;