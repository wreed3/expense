import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { getDatabase } from '../index';
import { logger } from '../utils/logger';
import { cache, CacheKeys } from '../utils/cache';
import { z } from 'zod';

const router = express.Router();

// Validation schemas
const customFieldSchema = z.object({
  name: z.string().min(1).max(100),
  field_type: z.enum(['text', 'number', 'date', 'boolean', 'select']),
  options: z.array(z.string()).optional(),
  is_required: z.boolean().optional()
});

const customFieldValueSchema = z.object({
  custom_field_id: z.number().int().positive(),
  value: z.string()
});

// Get all custom fields for user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user!.id;
    const cacheKey = CacheKeys.customFields(userId);
    
    // Try cache first
    const cached = await cache.get(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const db = getDatabase();
    const stmt = db.prepare(`
      SELECT * FROM custom_fields
      WHERE user_id = ?
      ORDER BY name
    `);
    
    const fields = stmt.all(userId).map((field: any) => ({
      ...field,
      options: field.options ? JSON.parse(field.options) : null
    }));
    
    // Cache for 10 minutes
    await cache.set(cacheKey, fields, 600);
    
    res.json(fields);
  } catch (error) {
    logger.error('Error fetching custom fields:', error);
    res.status(500).json({ error: 'Failed to fetch custom fields' });
  }
});

// Create custom field
router.post('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user!.id;
    const validated = customFieldSchema.parse(req.body);
    
    const db = getDatabase();
    const stmt = db.prepare(`
      INSERT INTO custom_fields (user_id, name, field_type, options, is_required)
      VALUES (?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(
      userId,
      validated.name,
      validated.field_type,
      validated.options ? JSON.stringify(validated.options) : null,
      validated.is_required || false
    );

    const field = db.prepare('SELECT * FROM custom_fields WHERE id = ?').get(result.lastInsertRowid);
    
    // Invalidate cache
    await cache.delete(CacheKeys.customFields(userId));
    
    res.status(201).json({
      ...field,
      options: (field as any).options ? JSON.parse((field as any).options) : null
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid request data', details: error.errors });
    }
    logger.error('Error creating custom field:', error);
    res.status(500).json({ error: 'Failed to create custom field' });
  }
});

// Update custom field
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.user!.id;
    const fieldId = parseInt(req.params.id);
    const validated = customFieldSchema.parse(req.body);
    
    const db = getDatabase();
    
    // Verify ownership
    const checkStmt = db.prepare('SELECT id FROM custom_fields WHERE id = ? AND user_id = ?');
    const existing = checkStmt.get(fieldId, userId);
    
    if (!existing) {
      return res.status(404).json({ error: 'Custom field not found' });
    }

    const updateStmt = db.prepare(`
      UPDATE custom_fields 
      SET name = ?, field_type = ?, options = ?, is_required = ?
      WHERE id = ? AND user_id = ?
    `);
    
    updateStmt.run(
      validated.name,
      validated.field_type,
      validated.options ? JSON.stringify(validated.options) : null,
      validated.is_required || false,
      fieldId,
      userId
    );

    const field = db.prepare('SELECT * FROM custom_fields WHERE id = ?').get(fieldId);
    
    // Invalidate cache
    await cache.delete(CacheKeys.customFields(userId));
    
    res.json({
      ...field,
      options: (field as any).options ? JSON.parse((field as any).options) : null
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid request data', details: error.errors });
    }
    logger.error('Error updating custom field:', error);
    res.status(500).json({ error: 'Failed to update custom field' });
  }
});

// Delete custom field
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.user!.id;
    const fieldId = parseInt(req.params.id);
    
    const db = getDatabase();
    
    // Verify ownership
    const checkStmt = db.prepare('SELECT id FROM custom_fields WHERE id = ? AND user_id = ?');
    const existing = checkStmt.get(fieldId, userId);
    
    if (!existing) {
      return res.status(404).json({ error: 'Custom field not found' });
    }

    // Delete field (cascade will remove custom_field_values)
    const deleteStmt = db.prepare('DELETE FROM custom_fields WHERE id = ? AND user_id = ?');
    deleteStmt.run(fieldId, userId);
    
    // Invalidate cache
    await cache.delete(CacheKeys.customFields(userId));
    await cache.deletePattern(`expenses:${userId}:*`);
    
    res.status(204).send();
  } catch (error) {
    logger.error('Error deleting custom field:', error);
    res.status(500).json({ error: 'Failed to delete custom field' });
  }
});

// Set custom field value for expense
router.post('/expense/:expenseId', authenticateToken, async (req, res) => {
  try {
    const userId = req.user!.id;
    const expenseId = parseInt(req.params.expenseId);
    const values = z.array(customFieldValueSchema).parse(req.body);
    
    const db = getDatabase();
    
    // Verify expense ownership
    const expenseStmt = db.prepare('SELECT id FROM expenses WHERE id = ? AND user_id = ?');
    const expense = expenseStmt.get(expenseId, userId);
    
    if (!expense) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    // Verify all custom fields belong to user
    const fieldIds = values.map(v => v.custom_field_id);
    const fieldStmt = db.prepare(`
      SELECT COUNT(*) as count FROM custom_fields 
      WHERE id IN (${fieldIds.map(() => '?').join(',')}) AND user_id = ?
    `);
    const fieldCheck = fieldStmt.get(...fieldIds, userId) as { count: number };
    
    if (fieldCheck.count !== fieldIds.length) {
      return res.status(400).json({ error: 'Invalid custom field IDs' });
    }

    // Remove existing values
    const deleteStmt = db.prepare('DELETE FROM custom_field_values WHERE expense_id = ?');
    deleteStmt.run(expenseId);

    // Add new values
    const insertStmt = db.prepare(`
      INSERT INTO custom_field_values (expense_id, custom_field_id, value) 
      VALUES (?, ?, ?)
    `);
    
    for (const value of values) {
      insertStmt.run(expenseId, value.custom_field_id, value.value);
    }
    
    // Invalidate cache
    await cache.deletePattern(`expenses:${userId}:*`);
    
    res.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid request data', details: error.errors });
    }
    logger.error('Error setting custom field values:', error);
    res.status(500).json({ error: 'Failed to set custom field values' });
  }
});

// Get custom field values for expense
router.get('/expense/:expenseId', authenticateToken, async (req, res) => {
  try {
    const userId = req.user!.id;
    const expenseId = parseInt(req.params.expenseId);
    
    const db = getDatabase();
    
    // Verify expense ownership
    const expenseStmt = db.prepare('SELECT id FROM expenses WHERE id = ? AND user_id = ?');
    const expense = expenseStmt.get(expenseId, userId);
    
    if (!expense) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    const stmt = db.prepare(`
      SELECT cfv.*, cf.name, cf.field_type
      FROM custom_field_values cfv
      INNER JOIN custom_fields cf ON cfv.custom_field_id = cf.id
      WHERE cfv.expense_id = ?
    `);
    
    const values = stmt.all(expenseId);
    res.json(values);
  } catch (error) {
    logger.error('Error fetching custom field values:', error);
    res.status(500).json({ error: 'Failed to fetch custom field values' });
  }
});

export default router;