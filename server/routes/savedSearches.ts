import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { getDatabase } from '../index';
import { logger } from '../utils/logger';
import { z } from 'zod';

const router = express.Router();

// Validation schema
const savedSearchSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  filters: z.object({
    query: z.string().optional(),
    categories: z.array(z.number()).optional(),
    tags: z.array(z.number()).optional(),
    dateFrom: z.string().optional(),
    dateTo: z.string().optional(),
    amountMin: z.number().optional(),
    amountMax: z.number().optional(),
    currency: z.string().optional(),
    merchant: z.string().optional(),
    hasReceipt: z.boolean().optional(),
    sortBy: z.string().optional(),
    sortOrder: z.string().optional()
  }),
  is_favorite: z.boolean().optional()
});

// Get all saved searches
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user!.id;
    const db = getDatabase();
    
    const stmt = db.prepare(`
      SELECT * FROM saved_searches
      WHERE user_id = ?
      ORDER BY is_favorite DESC, name
    `);
    
    const searches = stmt.all(userId).map((search: any) => ({
      ...search,
      filters: JSON.parse(search.filters)
    }));
    
    res.json(searches);
  } catch (error) {
    logger.error('Error fetching saved searches:', error);
    res.status(500).json({ error: 'Failed to fetch saved searches' });
  }
});

// Create saved search
router.post('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user!.id;
    const validated = savedSearchSchema.parse(req.body);
    
    const db = getDatabase();
    const stmt = db.prepare(`
      INSERT INTO saved_searches (user_id, name, description, filters, is_favorite)
      VALUES (?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(
      userId,
      validated.name,
      validated.description || null,
      JSON.stringify(validated.filters),
      validated.is_favorite || false
    );

    const search = db.prepare('SELECT * FROM saved_searches WHERE id = ?')
      .get(result.lastInsertRowid) as any;
    
    res.status(201).json({
      ...search,
      filters: JSON.parse(search.filters)
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid request data', details: error.errors });
    }
    logger.error('Error creating saved search:', error);
    res.status(500).json({ error: 'Failed to create saved search' });
  }
});

// Update saved search
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.user!.id;
    const searchId = parseInt(req.params.id);
    const validated = savedSearchSchema.parse(req.body);
    
    const db = getDatabase();
    
    // Verify ownership
    const checkStmt = db.prepare('SELECT id FROM saved_searches WHERE id = ? AND user_id = ?');
    const existing = checkStmt.get(searchId, userId);
    
    if (!existing) {
      return res.status(404).json({ error: 'Saved search not found' });
    }

    const updateStmt = db.prepare(`
      UPDATE saved_searches 
      SET name = ?, description = ?, filters = ?, is_favorite = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND user_id = ?
    `);
    
    updateStmt.run(
      validated.name,
      validated.description || null,
      JSON.stringify(validated.filters),
      validated.is_favorite || false,
      searchId,
      userId
    );

    const search = db.prepare('SELECT * FROM saved_searches WHERE id = ?').get(searchId) as any;
    
    res.json({
      ...search,
      filters: JSON.parse(search.filters)
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid request data', details: error.errors });
    }
    logger.error('Error updating saved search:', error);
    res.status(500).json({ error: 'Failed to update saved search' });
  }
});

// Delete saved search
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.user!.id;
    const searchId = parseInt(req.params.id);
    
    const db = getDatabase();
    
    // Verify ownership
    const checkStmt = db.prepare('SELECT id FROM saved_searches WHERE id = ? AND user_id = ?');
    const existing = checkStmt.get(searchId, userId);
    
    if (!existing) {
      return res.status(404).json({ error: 'Saved search not found' });
    }

    const deleteStmt = db.prepare('DELETE FROM saved_searches WHERE id = ? AND user_id = ?');
    deleteStmt.run(searchId, userId);
    
    res.status(204).send();
  } catch (error) {
    logger.error('Error deleting saved search:', error);
    res.status(500).json({ error: 'Failed to delete saved search' });
  }
});

// Toggle favorite
router.patch('/:id/favorite', authenticateToken, async (req, res) => {
  try {
    const userId = req.user!.id;
    const searchId = parseInt(req.params.id);
    
    const db = getDatabase();
    
    // Verify ownership and get current state
    const checkStmt = db.prepare('SELECT is_favorite FROM saved_searches WHERE id = ? AND user_id = ?');
    const existing = checkStmt.get(searchId, userId) as { is_favorite: number } | undefined;
    
    if (!existing) {
      return res.status(404).json({ error: 'Saved search not found' });
    }

    const newFavoriteState = existing.is_favorite ? 0 : 1;
    
    const updateStmt = db.prepare(`
      UPDATE saved_searches 
      SET is_favorite = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND user_id = ?
    `);
    
    updateStmt.run(newFavoriteState, searchId, userId);

    const search = db.prepare('SELECT * FROM saved_searches WHERE id = ?').get(searchId) as any;
    
    res.json({
      ...search,
      filters: JSON.parse(search.filters)
    });
  } catch (error) {
    logger.error('Error toggling favorite:', error);
    res.status(500).json({ error: 'Failed to toggle favorite' });
  }
});

export default router;