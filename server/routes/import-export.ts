import express from 'express';
import multer from 'multer';
import { parse } from 'csv-parse/sync';
import * as XLSX from 'xlsx';
import { z } from 'zod';
import { authenticateToken } from '../middleware/auth.js';
import { getDatabase } from '../index.js';
import { format } from 'date-fns';
import path from 'path';

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (['.csv', '.xlsx', '.xls'].includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV and Excel files are allowed'));
    }
  },
});

const expenseImportSchema = z.object({
  date: z.string(),
  amount: z.number().positive(),
  description: z.string().min(1),
  category: z.string().min(1),
  currency_code: z.string().length(3).optional(),
  tags: z.string().optional(),
});

// Import expenses from CSV/Excel
router.post('/import', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const db = getDatabase();
    let records: any[] = [];

    // Parse file based on type
    const ext = path.extname(req.file.originalname).toLowerCase();
    
    if (ext === '.csv') {
      records = parse(req.file.buffer, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      });
    } else {
      const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      records = XLSX.utils.sheet_to_json(worksheet);
    }

    // Validate and process records
    const errors: any[] = [];
    const imported: any[] = [];
    const categoryCache = new Map();
    const tagCache = new Map();

    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      
      try {
        // Normalize field names
        const normalizedRecord = {
          date: record.date || record.Date || record.DATE,
          amount: parseFloat(record.amount || record.Amount || record.AMOUNT),
          description: record.description || record.Description || record.DESCRIPTION,
          category: record.category || record.Category || record.CATEGORY,
          currency_code: record.currency_code || record.Currency || 'USD',
          tags: record.tags || record.Tags || '',
        };

        const validatedData = expenseImportSchema.parse(normalizedRecord);

        // Get or create category
        let categoryId = categoryCache.get(validatedData.category);
        if (!categoryId) {
          let category = db.prepare('SELECT id FROM categories WHERE user_id = ? AND name = ?')
            .get(req.user!.id, validatedData.category);
          
          if (!category) {
            const result = db.prepare('INSERT INTO categories (user_id, name, color) VALUES (?, ?, ?)')
              .run(req.user!.id, validatedData.category, '#3B82F6');
            categoryId = result.lastInsertRowid;
          } else {
            categoryId = (category as any).id;
          }
          categoryCache.set(validatedData.category, categoryId);
        }

        // Insert expense
        const expenseResult = db.prepare(`
          INSERT INTO expenses (user_id, amount, category_id, description, date, currency_code)
          VALUES (?, ?, ?, ?, ?, ?)
        `).run(
          req.user!.id,
          validatedData.amount,
          categoryId,
          validatedData.description,
          validatedData.date,
          validatedData.currency_code
        );

        // Handle tags
        if (validatedData.tags) {
          const tagNames = validatedData.tags.split(',').map(t => t.trim()).filter(t => t);
          
          for (const tagName of tagNames) {
            let tagId = tagCache.get(tagName);
            if (!tagId) {
              let tag = db.prepare('SELECT id FROM tags WHERE user_id = ? AND name = ?')
                .get(req.user!.id, tagName);
              
              if (!tag) {
                const result = db.prepare('INSERT INTO tags (user_id, name) VALUES (?, ?)')
                  .run(req.user!.id, tagName);
                tagId = result.lastInsertRowid;
              } else {
                tagId = (tag as any).id;
              }
              tagCache.set(tagName, tagId);
            }

            db.prepare('INSERT OR IGNORE INTO expense_tags (expense_id, tag_id) VALUES (?, ?)')
              .run(expenseResult.lastInsertRowid, tagId);
          }
        }

        imported.push({
          row: i + 1,
          ...validatedData,
        });
      } catch (error) {
        errors.push({
          row: i + 1,
          data: record,
          error: error instanceof z.ZodError ? error.errors : (error as Error).message,
        });
      }
    }

    res.json({
      success: true,
      imported_count: imported.length,
      error_count: errors.length,
      imported,
      errors,
    });
  } catch (error) {
    console.error('Error importing expenses:', error);
    res.status(500).json({ error: 'Failed to import expenses' });
  }
});

// Export to Excel
router.get('/export/excel', authenticateToken, (req, res) => {
  try {
    const { start_date, end_date, category_id } = req.query;
    const db = getDatabase();

    let query = `
      SELECT 
        e.date,
        e.amount,
        e.description,
        c.name as category,
        e.currency_code,
        GROUP_CONCAT(t.name, ', ') as tags
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

    query += ' GROUP BY e.id ORDER BY e.date DESC';

    const expenses = db.prepare(query).all(...params);

    // Create workbook
    const workbook = XLSX.utils.book_new();
    
    // Add expenses sheet
    const worksheet = XLSX.utils.json_to_sheet(expenses);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Expenses');

    // Add summary sheet
    const summary = [
      { Metric: 'Total Expenses', Value: expenses.length },
      { Metric: 'Total Amount', Value: (expenses as any[]).reduce((sum, e) => sum + e.amount, 0) },
      { Metric: 'Date Range', Value: `${start_date || 'All'} to ${end_date || 'All'}` },
    ];
    const summarySheet = XLSX.utils.json_to_sheet(summary);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

    // Generate buffer
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=expenses-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
    res.send(buffer);
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    res.status(500).json({ error: 'Failed to export expenses' });
  }
});

// Full backup
router.get('/backup', authenticateToken, (req, res) => {
  try {
    const db = getDatabase();

    const backup = {
      version: '2.0.0',
      exported_at: new Date().toISOString(),
      data: {
        expenses: db.prepare('SELECT * FROM expenses WHERE user_id = ?').all(req.user!.id),
        categories: db.prepare('SELECT * FROM categories WHERE user_id = ?').all(req.user!.id),
        budgets: db.prepare('SELECT * FROM budgets WHERE user_id = ?').all(req.user!.id),
        tags: db.prepare('SELECT * FROM tags WHERE user_id = ?').all(req.user!.id),
        custom_fields: db.prepare('SELECT * FROM custom_fields WHERE user_id = ?').all(req.user!.id),
        expense_tags: db.prepare(`
          SELECT et.* FROM expense_tags et
          JOIN expenses e ON et.expense_id = e.id
          WHERE e.user_id = ?
        `).all(req.user!.id),
        expense_custom_fields: db.prepare(`
          SELECT ecf.* FROM expense_custom_fields ecf
          JOIN expenses e ON ecf.expense_id = e.id
          WHERE e.user_id = ?
        `).all(req.user!.id),
      },
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=expense-tracker-backup-${format(new Date(), 'yyyy-MM-dd')}.json`);
    res.json(backup);
  } catch (error) {
    console.error('Error creating backup:', error);
    res.status(500).json({ error: 'Failed to create backup' });
  }
});

// Restore from backup
router.post('/restore', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const backup = JSON.parse(req.file.buffer.toString());
    const db = getDatabase();

    // Validate backup structure
    if (!backup.data || !backup.version) {
      return res.status(400).json({ error: 'Invalid backup file' });
    }

    // Start transaction
    db.prepare('BEGIN TRANSACTION').run();

    try {
      // Restore categories first
      const categoryIdMap = new Map();
      for (const category of backup.data.categories) {
        const result = db.prepare(`
          INSERT INTO categories (user_id, name, color, icon)
          VALUES (?, ?, ?, ?)
        `).run(req.user!.id, category.name, category.color, category.icon);
        categoryIdMap.set(category.id, result.lastInsertRowid);
      }

      // Restore tags
      const tagIdMap = new Map();
      for (const tag of backup.data.tags) {
        const result = db.prepare(`
          INSERT INTO tags (user_id, name, color)
          VALUES (?, ?, ?)
        `).run(req.user!.id, tag.name, tag.color);
        tagIdMap.set(tag.id, result.lastInsertRowid);
      }

      // Restore custom fields
      const customFieldIdMap = new Map();
      for (const field of backup.data.custom_fields) {
        const result = db.prepare(`
          INSERT INTO custom_fields (user_id, name, field_type, options, is_required)
          VALUES (?, ?, ?, ?, ?)
        `).run(req.user!.id, field.name, field.field_type, field.options, field.is_required);
        customFieldIdMap.set(field.id, result.lastInsertRowid);
      }

      // Restore expenses
      const expenseIdMap = new Map();
      for (const expense of backup.data.expenses) {
        const result = db.prepare(`
          INSERT INTO expenses (user_id, amount, category_id, description, date, receipt_path, is_recurring, recurring_frequency, currency_code, original_amount)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          req.user!.id,
          expense.amount,
          categoryIdMap.get(expense.category_id),
          expense.description,
          expense.date,
          expense.receipt_path,
          expense.is_recurring,
          expense.recurring_frequency,
          expense.currency_code || 'USD',
          expense.original_amount
        );
        expenseIdMap.set(expense.id, result.lastInsertRowid);
      }

      // Restore budgets
      for (const budget of backup.data.budgets) {
        db.prepare(`
          INSERT INTO budgets (user_id, category_id, amount, period, start_date, end_date)
          VALUES (?, ?, ?, ?, ?, ?)
        `).run(
          req.user!.id,
          categoryIdMap.get(budget.category_id),
          budget.amount,
          budget.period,
          budget.start_date,
          budget.end_date
        );
      }

      // Restore expense tags
      for (const expenseTag of backup.data.expense_tags) {
        const newExpenseId = expenseIdMap.get(expenseTag.expense_id);
        const newTagId = tagIdMap.get(expenseTag.tag_id);
        if (newExpenseId && newTagId) {
          db.prepare(`
            INSERT OR IGNORE INTO expense_tags (expense_id, tag_id)
            VALUES (?, ?)
          `).run(newExpenseId, newTagId);
        }
      }

      // Restore expense custom fields
      for (const ecf of backup.data.expense_custom_fields) {
        const newExpenseId = expenseIdMap.get(ecf.expense_id);
        const newFieldId = customFieldIdMap.get(ecf.custom_field_id);
        if (newExpenseId && newFieldId) {
          db.prepare(`
            INSERT OR IGNORE INTO expense_custom_fields (expense_id, custom_field_id, value)
            VALUES (?, ?, ?)
          `).run(newExpenseId, newFieldId, ecf.value);
        }
      }

      db.prepare('COMMIT').run();

      res.json({
        success: true,
        message: 'Backup restored successfully',
        restored: {
          expenses: backup.data.expenses.length,
          categories: backup.data.categories.length,
          tags: backup.data.tags.length,
          budgets: backup.data.budgets.length,
        },
      });
    } catch (error) {
      db.prepare('ROLLBACK').run();
      throw error;
    }
  } catch (error) {
    console.error('Error restoring backup:', error);
    res.status(500).json({ error: 'Failed to restore backup' });
  }
});

// Download import template
router.get('/template', authenticateToken, (req, res) => {
  try {
    const template = [
      {
        date: '2024-01-15',
        amount: 50.00,
        description: 'Grocery shopping',
        category: 'Food & Dining',
        currency_code: 'USD',
        tags: 'groceries, weekly',
      },
      {
        date: '2024-01-16',
        amount: 30.00,
        description: 'Gas station',
        category: 'Transportation',
        currency_code: 'USD',
        tags: 'fuel',
      },
    ];

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(template);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Expenses');

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=expense-import-template.xlsx');
    res.send(buffer);
  } catch (error) {
    console.error('Error generating template:', error);
    res.status(500).json({ error: 'Failed to generate template' });
  }
});

export default router;