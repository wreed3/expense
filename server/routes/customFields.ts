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

    const field = db.prepare('SELECT * FROM custom_fields WHERE id = ?')
      .get(result.lastInsertRowid) as any;
    
    // Invalidate cache
    await cache.delete(CacheKeys.customFields(userId));
    
    res.status(201).json({
      ...field,
      options: field.options ? JSON.parse(field.options) : null
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

    const field = db.prepare('SELECT * FROM custom_fields WHERE id = ?').get(fieldId) as any;
    
    // Invalidate cache
    await cache.delete(CacheKeys.customFields(userId));
    
    res.json({
      ...field,
      options: field.options ? JSON.parse(field.options) : null
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

    // Delete field (cascade will remove custom_field_values entries)
    const deleteStmt = db.prepare('DELETE FROM custom_fields WHERE id = ? AND user_id = ?');
    deleteStmt.run(fieldId, userId);
    
    // Invalidate cache
    await cache.delete(CacheKeys.customFields(userId));
    
    res.status(204).send();
  } catch (error) {
    logger.error('Error deleting custom field:', error);
    res.status(500).json({ error: 'Failed to delete custom field' });
  }
});

export default router;