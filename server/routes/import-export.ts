import express from 'express';
import multer from 'multer';
import { parse } from 'csv-parse/sync';
import * as XLSX from 'xlsx';
import { z } from 'zod';
import { authenticateToken } from '../middleware/auth';
import { getDb } from '../index';
import { format } from 'date-fns';
import path from 'path';
import fs from 'fs';

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

    const db = getDb();
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
    const validRecords: any[] = [];
    const categoryCache = new Map();

    records.forEach((record, index) => {
      try {
        // Normalize field names (handle variations)
        const normalized = {
          date: record.date || record.Date || record.DATE,
          amount: parseFloat(record.amount || record.Amount || record.AMOUNT),
          description: record.description || record.Description || record.DESCRIPTION,
          category: record.category || record.Category || record.CATEGORY,
          currency_code: record.currency_code || record.currency || 'USD',
          tags: record.tags || record.Tags || '',
        };

        const validated = expenseImportSchema.parse(normalized);
        validRecords.push({ ...validated, rowNumber: index + 2 });
      } catch (error) {
        errors.push({
          row: index + 2,
          error: error instanceof z.ZodError ? error.errors : 'Invalid data format',
          data: record,
        });
      }
    });

    // If there are validation errors, return them
    if (errors.length > 0) {
      return res.status(400).json({
        error: 'Validation failed',
        errors,
        valid_count: validRecords.length,
        error_count: errors.length,
      });
    }

    // Import valid records
    const imported: any[] = [];
    const importErrors: any[] = [];

    db.prepare('BEGIN TRANSACTION').run();

    try {
      for (const record of validRecords) {
        try {
          // Find or create category
          let category = categoryCache.get(record.category);
          
          if (!category) {
            category = db.prepare('SELECT id FROM categories WHERE user_id = ? AND name = ?')
              .get(req.user!.id, record.category);
            
            if (!category) {
              const result = db.prepare('INSERT INTO categories (user_id, name, color) VALUES (?, ?, ?)')
                .run(req.user!.id, record.category, '#3B82F6');
              category = { id: result.lastInsertRowid };
            }
            
            categoryCache.set(record.category, category);
          }

          // Insert expense
          const result = db.prepare(`
            INSERT INTO expenses (user_id, amount, category_id, description, date, currency_code)
            VALUES (?, ?, ?, ?, ?, ?)
          `).run(
            req.user!.id,
            record.amount,
            category.id,
            record.description,
            new Date(record.date).toISOString(),
            record.currency_code
          );

          // Handle tags if provided
          if (record.tags) {
            const tagNames = record.tags.split(',').map((t: string) => t.trim());
            
            for (const tagName of tagNames) {
              if (!tagName) continue;
              
              let tag = db.prepare('SELECT id FROM tags WHERE user_id = ? AND name = ?')
                .get(req.user!.id, tagName);
              
              if (!tag) {
                const tagResult = db.prepare('INSERT INTO tags (user_id, name) VALUES (?, ?)')
                  .run(req.user!.id, tagName);
                tag = { id: tagResult.lastInsertRowid };
              }
              
              db.prepare('INSERT OR IGNORE INTO expense_tags (expense_id, tag_id) VALUES (?, ?)')
                .run(result.lastInsertRowid, tag.id);
            }
          }

          imported.push({
            row: record.rowNumber,
            expense_id: result.lastInsertRowid,
          });
        } catch (error) {
          importErrors.push({
            row: record.rowNumber,
            error: (error as Error).message,
            data: record,
          });
        }
      }

      db.prepare('COMMIT').run();

      res.json({
        success: true,
        imported_count: imported.length,
        error_count: importErrors.length,
        imported,
        errors: importErrors,
      });
    } catch (error) {
      db.prepare('ROLLBACK').run();
      throw error;
    }
  } catch (error) {
    console.error('Error importing expenses:', error);
    res.status(500).json({ error: 'Failed to import expenses' });
  }
});

// Export expenses to Excel
router.get('/export/excel', authenticateToken, (req, res) => {
  try {
    const { start_date, end_date, category_id } = req.query;
    const db = getDb();

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

    const expenses = db.prepare(query).all(...params) as any[];

    // Format data for Excel
    const data = expenses.map(e => ({
      Date: format(new Date(e.date), 'yyyy-MM-dd'),
      Amount: e.amount,
      Description: e.description,
      Category: e.category,
      Currency: e.currency_code,
      Tags: e.tags || '',
    }));

    // Create workbook
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Expenses');

    // Add summary sheet
    const summary = {
      'Total Expenses': expenses.length,
      'Total Amount': expenses.reduce((sum, e) => sum + e.amount, 0).toFixed(2),
      'Date Range': start_date && end_date 
        ? `${format(new Date(start_date as string), 'MMM dd, yyyy')} - ${format(new Date(end_date as string), 'MMM dd, yyyy')}`
        : 'All time',
      'Export Date': format(new Date(), 'MMM dd, yyyy HH:mm:ss'),
    };

    const summaryData = Object.entries(summary).map(([key, value]) => ({ Field: key, Value: value }));
    const summarySheet = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

    // Generate buffer
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=expenses-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
    res.send(buffer);
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    res.status(500).json({ error: 'Failed to export to Excel' });
  }
});

// Full backup
router.get('/backup', authenticateToken, (req, res) => {
  try {
    const db = getDb();

    const backup = {
      version: '2.0.0',
      exported_at: new Date().toISOString(),
      user: db.prepare('SELECT id, email, name FROM users WHERE id = ?').get(req.user!.id),
      categories: db.prepare('SELECT * FROM categories WHERE user_id = ?').all(req.user!.id),
      tags: db.prepare('SELECT * FROM tags WHERE user_id = ?').all(req.user!.id),
      custom_fields: db.prepare('SELECT * FROM custom_fields WHERE user_id = ?').all(req.user!.id),
      budgets: db.prepare('SELECT * FROM budgets WHERE user_id = ?').all(req.user!.id),
      expenses: db.prepare(`
        SELECT e.*, GROUP_CONCAT(DISTINCT t.id) as tag_ids
        FROM expenses e
        LEFT JOIN expense_tags et ON e.id = et.expense_id
        LEFT JOIN tags t ON et.tag_id = t.id
        WHERE e.user_id = ?
        GROUP BY e.id
      `).all(req.user!.id),
      expense_custom_fields: db.prepare(`
        SELECT ecf.*
        FROM expense_custom_fields ecf
        JOIN expenses e ON ecf.expense_id = e.id
        WHERE e.user_id = ?
      `).all(req.user!.id),
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
      return res.status(400).json({ error: 'No backup file uploaded' });
    }

    const backup = JSON.parse(req.file.buffer.toString());
    const db = getDb();

    // Validate backup format
    if (!backup.version || !backup.expenses) {
      return res.status(400).json({ error: 'Invalid backup file format' });
    }

    db.prepare('BEGIN TRANSACTION').run();

    try {
      const categoryMap = new Map();
      const tagMap = new Map();
      const customFieldMap = new Map();

      // Restore categories
      for (const cat of backup.categories) {
        const result = db.prepare(`
          INSERT INTO categories (user_id, name, color, icon)
          VALUES (?, ?, ?, ?)
        `).run(req.user!.id, cat.name, cat.color, cat.icon);
        categoryMap.set(cat.id, result.lastInsertRowid);
      }

      // Restore tags
      for (const tag of backup.tags) {
        const result = db.prepare(`
          INSERT INTO tags (user_id, name, color)
          VALUES (?, ?, ?)
        `).run(req.user!.id, tag.name, tag.color);
        tagMap.set(tag.id, result.lastInsertRowid);
      }

      // Restore custom fields
      for (const field of backup.custom_fields || []) {
        const result = db.prepare(`
          INSERT INTO custom_fields (user_id, name, field_type, options, is_required)
          VALUES (?, ?, ?, ?, ?)
        `).run(req.user!.id, field.name, field.field_type, field.options, field.is_required);
        customFieldMap.set(field.id, result.lastInsertRowid);
      }

      // Restore budgets
      for (const budget of backup.budgets) {
        const newCategoryId = categoryMap.get(budget.category_id);
        if (newCategoryId) {
          db.prepare(`
            INSERT INTO budgets (user_id, category_id, amount, period, start_date, end_date)
            VALUES (?, ?, ?, ?, ?, ?)
          `).run(
            req.user!.id,
            newCategoryId,
            budget.amount,
            budget.period,
            budget.start_date,
            budget.end_date
          );
        }
      }

      // Restore expenses
      const expenseMap = new Map();
      for (const expense of backup.expenses) {
        const newCategoryId = categoryMap.get(expense.category_id);
        if (newCategoryId) {
          const result = db.prepare(`
            INSERT INTO expenses (
              user_id, amount, category_id, description, date,
              receipt_path, is_recurring, recurring_frequency,
              currency_code, original_amount
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).run(
            req.user!.id,
            expense.amount,
            newCategoryId,
            expense.description,
            expense.date,
            null, // Don't restore receipt paths
            expense.is_recurring,
            expense.recurring_frequency,
            expense.currency_code,
            expense.original_amount
          );

          const newExpenseId = result.lastInsertRowid;
          expenseMap.set(expense.id, newExpenseId);

          // Restore expense tags
          if (expense.tag_ids) {
            const tagIds = expense.tag_ids.split(',').map((id: string) => parseInt(id));
            for (const oldTagId of tagIds) {
              const newTagId = tagMap.get(oldTagId);
              if (newTagId) {
                db.prepare('INSERT INTO expense_tags (expense_id, tag_id) VALUES (?, ?)')
                  .run(newExpenseId, newTagId);
              }
            }
          }
        }
      }

      // Restore expense custom fields
      for (const ecf of backup.expense_custom_fields || []) {
        const newExpenseId = expenseMap.get(ecf.expense_id);
        const newFieldId = customFieldMap.get(ecf.custom_field_id);
        
        if (newExpenseId && newFieldId) {
          db.prepare(`
            INSERT INTO expense_custom_fields (expense_id, custom_field_id, value)
            VALUES (?, ?, ?)
          `).run(newExpenseId, newFieldId, ecf.value);
        }
      }

      db.prepare('COMMIT').run();

      res.json({
        success: true,
        message: 'Backup restored successfully',
        restored: {
          categories: backup.categories.length,
          tags: backup.tags.length,
          custom_fields: backup.custom_fields?.length || 0,
          budgets: backup.budgets.length,
          expenses: backup.expenses.length,
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

// Get import template
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
        amount: 25.50,
        description: 'Gas station',
        category: 'Transportation',
        currency_code: 'USD',
        tags: 'fuel',
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(template);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Template');

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