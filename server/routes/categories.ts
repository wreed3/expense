import { Router, Response } from 'express';
import { z } from 'zod';
import { getDb } from '../utils/db.js';
import { authenticateToken } from '../middleware/auth.js';
import type { AuthRequest, CategoryBody } from '../types/express.js';

const router: Router = Router();

const categorySchema = z.object({
  name: z.string().min(1),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  icon: z.string().optional(),
});

interface Category {
  id: number;
  user_id: number;
  name: string;
  color: string;
  icon: string | null;
  created_at: string;
}

router.get('/', authenticateToken, (req: AuthRequest, res: Response): void => {
  try {
    const db = getDb();
    const categories = db.prepare(
      'SELECT * FROM categories WHERE user_id = ? ORDER BY name'
    ).all(req.userId) as Category[];
    
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

router.post('/', authenticateToken, (req: AuthRequest, res: Response): void => {
  try {
    const categoryData = categorySchema.parse(req.body) as CategoryBody;
    const db = getDb();
    
    const existing = db.prepare('SELECT id FROM categories WHERE user_id = ? AND name = ?')
      .get(req.userId, categoryData.name) as { id: number } | undefined;
    
    if (existing) {
      res.status(400).json({ error: 'Category already exists' });
      return;
    }
    
    const result = db.prepare(
      'INSERT INTO categories (user_id, name, color, icon) VALUES (?, ?, ?, ?)'
    ).run(req.userId, categoryData.name, categoryData.color, categoryData.icon || null);
    
    const category = db.prepare('SELECT * FROM categories WHERE id = ?')
      .get(result.lastInsertRowid) as Category;
    
    res.status(201).json(category);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors });
      return;
    }
    res.status(500).json({ error: 'Failed to create category' });
  }
});

router.put('/:id', authenticateToken, (req: AuthRequest, res: Response): void => {
  try {
    const categoryData = categorySchema.parse(req.body) as CategoryBody;
    const db = getDb();
    
    const existing = db.prepare('SELECT id FROM categories WHERE id = ? AND user_id = ?')
      .get(req.params.id, req.userId) as { id: number } | undefined;
    
    if (!existing) {
      res.status(404).json({ error: 'Category not found' });
      return;
    }
    
    db.prepare('UPDATE categories SET name = ?, color = ?, icon = ? WHERE id = ?')
      .run(categoryData.name, categoryData.color, categoryData.icon || null, req.params.id);
    
    const category = db.prepare('SELECT * FROM categories WHERE id = ?')
      .get(req.params.id) as Category;
    
    res.json(category);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors });
      return;
    }
    res.status(500).json({ error: 'Failed to update category' });
  }
});

router.delete('/:id', authenticateToken, (req: AuthRequest, res: Response): void => {
  try {
    const db = getDb();
    
    const existing = db.prepare('SELECT id FROM categories WHERE id = ? AND user_id = ?')
      .get(req.params.id, req.userId) as { id: number } | undefined;
    
    if (!existing) {
      res.status(404).json({ error: 'Category not found' });
      return;
    }
    
    const expenseCount = db.prepare('SELECT COUNT(*) as count FROM expenses WHERE category_id = ?')
      .get(req.params.id) as { count: number };
    
    if (expenseCount.count > 0) {
      res.status(400).json({ error: 'Cannot delete category with existing expenses' });
      return;
    }
    
    db.prepare('DELETE FROM categories WHERE id = ?').run(req.params.id);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

export default router;