import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { getDatabase } from '../index';
import { logger } from '../utils/logger';
import { cache, CacheKeys } from '../utils/cache';
import { z } from 'zod';

const router = express.Router();

// Validation schemas
const tagSchema = z.object({
  name: z.string().min(1).max(50),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional()
});

// Get all tags for user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user!.id;
    const cacheKey = CacheKeys.tags(userId);
    
    // Try cache first
    const cached = await cache.get(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const db = getDatabase();
    const stmt = db.prepare(`
      SELECT t.*, COUNT(DISTINCT et.expense_id) as usage_count
      FROM tags t
      LEFT JOIN expense_tags et ON t.id = et.tag_id
      WHERE t.user_id = ?
      GROUP BY t.id
      ORDER BY t.name
    `);
    
    const tags = stmt.all(userId);
    
    // Cache for 5 minutes
    await cache.set(cacheKey, tags, 300);
    
    res.json(tags);
  } catch (error) {
    logger.error('Error fetching tags:', error);
    res.status(500).json({ error: 'Failed to fetch tags' });
  }
});

// Create new tag
router.post('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user!.id;
    const validated = tagSchema.parse(req.body);
    
    const db = getDatabase();
    const stmt = db.prepare(`
      INSERT INTO tags (user_id, name, color)
      VALUES (?, ?, ?)
    `);
    
    const result = stmt.run(
      userId,
      validated.name,
      validated.color || '#3B82F6'
    );

    const tag = db.prepare('SELECT * FROM tags WHERE id = ?').get(result.lastInsertRowid);
    
    // Invalidate cache
    await cache.delete(CacheKeys.tags(userId));
    
    res.status(201).json(tag);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid request data', details: error.errors });
    }
    logger.error('Error creating tag:', error);
    res.status(500).json({ error: 'Failed to create tag' });
  }
});

// Update tag
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.user!.id;
    const tagId = parseInt(req.params.id);
    const validated = tagSchema.parse(req.body);
    
    const db = getDatabase();
    
    // Verify ownership
    const checkStmt = db.prepare('SELECT id FROM tags WHERE id = ? AND user_id = ?');
    const existing = checkStmt.get(tagId, userId);
    
    if (!existing) {
      return res.status(404).json({ error: 'Tag not found' });
    }

    const updateStmt = db.prepare(`
      UPDATE tags 
      SET name = ?, color = ?
      WHERE id = ? AND user_id = ?
    `);
    
    updateStmt.run(validated.name, validated.color || '#3B82F6', tagId, userId);

    const tag = db.prepare('SELECT * FROM tags WHERE id = ?').get(tagId);
    
    // Invalidate cache
    await cache.delete(CacheKeys.tags(userId));
    await cache.deletePattern(`expenses:${userId}:*`);
    
    res.json(tag);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid request data', details: error.errors });
    }
    logger.error('Error updating tag:', error);
    res.status(500).json({ error: 'Failed to update tag' });
  }
});

// Delete tag
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.user!.id;
    const tagId = parseInt(req.params.id);
    
    const db = getDatabase();
    
    // Verify ownership
    const checkStmt = db.prepare('SELECT id FROM tags WHERE id = ? AND user_id = ?');
    const existing = checkStmt.get(tagId, userId);
    
    if (!existing) {
      return res.status(404).json({ error: 'Tag not found' });
    }

    // Delete tag (cascade will remove expense_tags entries)
    const deleteStmt = db.prepare('DELETE FROM tags WHERE id = ? AND user_id = ?');
    deleteStmt.run(tagId, userId);
    
    // Invalidate cache
    await cache.delete(CacheKeys.tags(userId));
    await cache.deletePattern(`expenses:${userId}:*`);
    
    res.status(204).send();
  } catch (error) {
    logger.error('Error deleting tag:', error);
    res.status(500).json({ error: 'Failed to delete tag' });
  }
});

export default router;