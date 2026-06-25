import express from 'express';
import { z } from 'zod';
import { authenticateToken } from '../middleware/auth.js';
import { getDatabase } from '../index.js';

const router = express.Router();

const tagSchema = z.object({
  name: z.string().min(1).max(50),
  color: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
});

// Get all tags for user
router.get('/', authenticateToken, (req, res) => {
  try {
    const db = getDatabase();
    const tags = db.prepare(`
      SELECT t.*, COUNT(et.expense_id) as usage_count
      FROM tags t
      LEFT JOIN expense_tags et ON t.id = et.tag_id
      WHERE t.user_id = ?
      GROUP BY t.id
      ORDER BY t.name ASC
    `).all(req.user!.id);

    res.json(tags);
  } catch (error) {
    console.error('Error fetching tags:', error);
    res.status(500).json({ error: 'Failed to fetch tags' });
  }
});

// Create tag
router.post('/', authenticateToken, (req, res) => {
  try {
    const validatedData = tagSchema.parse(req.body);
    const db = getDatabase();

    const result = db.prepare(`
      INSERT INTO tags (user_id, name, color)
      VALUES (?, ?, ?)
    `).run(req.user!.id, validatedData.name, validatedData.color || null);

    const tag = db.prepare('SELECT * FROM tags WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(tag);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid tag data', details: error.errors });
    }
    if ((error as any).code === 'SQLITE_CONSTRAINT') {
      return res.status(400).json({ error: 'Tag name already exists' });
    }
    console.error('Error creating tag:', error);
    res.status(500).json({ error: 'Failed to create tag' });
  }
});

// Update tag
router.put('/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const validatedData = tagSchema.parse(req.body);
    const db = getDatabase();

    const result = db.prepare(`
      UPDATE tags 
      SET name = ?, color = ?
      WHERE id = ? AND user_id = ?
    `).run(validatedData.name, validatedData.color || null, id, req.user!.id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Tag not found' });
    }

    const tag = db.prepare('SELECT * FROM tags WHERE id = ?').get(id);
    res.json(tag);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid tag data', details: error.errors });
    }
    console.error('Error updating tag:', error);
    res.status(500).json({ error: 'Failed to update tag' });
  }
});

// Delete tag
router.delete('/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const db = getDatabase();

    const result = db.prepare(`
      DELETE FROM tags WHERE id = ? AND user_id = ?
    `).run(id, req.user!.id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Tag not found' });
    }

    res.json({ message: 'Tag deleted successfully' });
  } catch (error) {
    console.error('Error deleting tag:', error);
    res.status(500).json({ error: 'Failed to delete tag' });
  }
});

export default router;