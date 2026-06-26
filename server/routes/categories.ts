import { Router } from 'express';
import { db } from '../db';
import { authenticate } from '../middleware/auth';
import { z } from 'zod';

export const categoryRoutes = Router();

const categorySchema = z.object({
  name: z.string().min(1, 'Category name is required'),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format'),
  icon: z.string().optional(),
});

// Get all categories for user
categoryRoutes.get('/', authenticate, async (req, res, next) => {
  try {
    const categories = db.prepare(`
      SELECT * FROM categories 
      WHERE user_id = ? 
      ORDER BY name
    `).all(req.user!.id);
    
    res.json(categories);
  } catch (error) {
    next(error);
  }
});

// Get category by ID
categoryRoutes.get('/:id', authenticate, async (req, res, next) => {
  try {
    const category = db.prepare(`
      SELECT * FROM categories 
      WHERE id = ? AND user_id = ?
    `).get(req.params.id, req.user!.id);
    
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    
    res.json(category);
  } catch (error) {
    next(error);
  }
});

// Create category
categoryRoutes.post('/', authenticate, async (req, res, next) => {
  try {
    const validated = categorySchema.parse(req.body);
    
    const result = db.prepare(`
      INSERT INTO categories (name, color, icon, user_id)
      VALUES (?, ?, ?, ?)
    `).run(validated.name, validated.color, validated.icon, req.user!.id);
    
    const category = db.prepare(`
      SELECT * FROM categories WHERE id = ?
    `).get(result.lastInsertRowid);
    
    res.status(201).json(category);
  } catch (error) {
    next(error);
  }
});

// Update category
categoryRoutes.put('/:id', authenticate, async (req, res, next) => {
  try {
    const validated = categorySchema.parse(req.body);
    
    const existing = db.prepare(`
      SELECT * FROM categories 
      WHERE id = ? AND user_id = ?
    `).get(req.params.id, req.user!.id);
    
    if (!existing) {
      return res.status(404).json({ message: 'Category not found' });
    }
    
    db.prepare(`
      UPDATE categories 
      SET name = ?, color = ?, icon = ?
      WHERE id = ? AND user_id = ?
    `).run(validated.name, validated.color, validated.icon, req.params.id, req.user!.id);
    
    const category = db.prepare(`
      SELECT * FROM categories WHERE id = ?
    `).get(req.params.id);
    
    res.json(category);
  } catch (error) {
    next(error);
  }
});

// Delete category
categoryRoutes.delete('/:id', authenticate, async (req, res, next) => {
  try {
    const category = db.prepare(`
      SELECT * FROM categories 
      WHERE id = ? AND user_id = ?
    `).get(req.params.id, req.user!.id);
    
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    
    // Check if category is in use
    const expenseCount = db.prepare(`
      SELECT COUNT(*) as count FROM expenses 
      WHERE category_id = ? AND user_id = ?
    `).get(req.params.id, req.user!.id) as { count: number };
    
    if (expenseCount.count > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete category with existing expenses' 
      });
    }
    
    db.prepare(`
      DELETE FROM categories 
      WHERE id = ? AND user_id = ?
    `).run(req.params.id, req.user!.id);
    
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});