import express from 'express';
import { z } from 'zod';
import { authenticateToken } from '../middleware/auth.js';
import { getDatabase } from '../index.js';

const router = express.Router();

const customFieldSchema = z.object({
  name: z.string().min(1).max(100),
  field_type: z.enum(['text', 'number', 'date', 'boolean', 'select']),
  options: z.string().optional(),
  is_required: z.boolean().default(false),
});

// Get all custom fields for user
router.get('/', authenticateToken, (req, res) => {
  try {
    const db = getDatabase();
    const fields = db.prepare(`
      SELECT * FROM custom_fields 
      WHERE user_id = ?
      ORDER BY created_at ASC
    `).all(req.user!.id);

    res.json(fields.map(field => ({
      ...field,
      options: (field as any).options ? JSON.parse((field as any).options) : null,
      is_required: Boolean((field as any).is_required),
    })));
  } catch (error) {
    console.error('Error fetching custom fields:', error);
    res.status(500).json({ error: 'Failed to fetch custom fields' });
  }
});

// Create custom field
router.post('/', authenticateToken, (req, res) => {
  try {
    const validatedData = customFieldSchema.parse(req.body);
    const db = getDatabase();

    const options = validatedData.options ? JSON.stringify(validatedData.options) : null;

    const result = db.prepare(`
      INSERT INTO custom_fields (user_id, name, field_type, options, is_required)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      req.user!.id,
      validatedData.name,
      validatedData.field_type,
      options,
      validatedData.is_required ? 1 : 0
    );

    const field = db.prepare('SELECT * FROM custom_fields WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({
      ...field,
      options: (field as any).options ? JSON.parse((field as any).options) : null,
      is_required: Boolean((field as any).is_required),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid custom field data', details: error.errors });
    }
    if ((error as any).code === 'SQLITE_CONSTRAINT') {
      return res.status(400).json({ error: 'Custom field name already exists' });
    }
    console.error('Error creating custom field:', error);
    res.status(500).json({ error: 'Failed to create custom field' });
  }
});

// Update custom field
router.put('/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const validatedData = customFieldSchema.parse(req.body);
    const db = getDatabase();

    const options = validatedData.options ? JSON.stringify(validatedData.options) : null;

    const result = db.prepare(`
      UPDATE custom_fields 
      SET name = ?, field_type = ?, options = ?, is_required = ?
      WHERE id = ? AND user_id = ?
    `).run(
      validatedData.name,
      validatedData.field_type,
      options,
      validatedData.is_required ? 1 : 0,
      id,
      req.user!.id
    );

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Custom field not found' });
    }

    const field = db.prepare('SELECT * FROM custom_fields WHERE id = ?').get(id);
    res.json({
      ...field,
      options: (field as any).options ? JSON.parse((field as any).options) : null,
      is_required: Boolean((field as any).is_required),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid custom field data', details: error.errors });
    }
    console.error('Error updating custom field:', error);
    res.status(500).json({ error: 'Failed to update custom field' });
  }
});

// Delete custom field
router.delete('/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const db = getDatabase();

    const result = db.prepare(`
      DELETE FROM custom_fields WHERE id = ? AND user_id = ?
    `).run(id, req.user!.id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Custom field not found' });
    }

    res.json({ message: 'Custom field deleted successfully' });
  } catch (error) {
    console.error('Error deleting custom field:', error);
    res.status(500).json({ error: 'Failed to delete custom field' });
  }
});

export default router;