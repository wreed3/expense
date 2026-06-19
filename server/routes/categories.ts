import { Router } from 'express';
import { Database } from '../database.js';

export const categoryRoutes = Router();
const db = Database.getInstance().getDb();

// Get all categories
categoryRoutes.get('/', (req, res) => {
  try {
    const categories = db.prepare('SELECT * FROM categories ORDER BY name').all();
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// Get category by ID
categoryRoutes.get('/:id', (req, res) => {
  try {
    const category = db.prepare('SELECT * FROM categories WHERE id = ?').get(req.params.id);
    
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }
    res.json(category);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch category' });
  }
});

// Create category
categoryRoutes.post('/', (req, res) => {
  try {
    const { name, color, icon } = req.body;

    if (!name || !color || !icon) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const result = db.prepare(`
      INSERT INTO categories (name, color, icon)
      VALUES (?, ?, ?)
    `).run(name, color, icon);

    const category = db.prepare('SELECT * FROM categories WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(category);
  } catch (error: any) {
    if (error.message.includes('UNIQUE constraint failed')) {
      return res.status(409).json({ error: 'Category name already exists' });
    }
    res.status(500).json({ error: 'Failed to create category' });
  }
});

// Update category
categoryRoutes.put('/:id', (req, res) => {
  try {
    const { name, color, icon } = req.body;

    if (!name || !color || !icon) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const result = db.prepare(`
      UPDATE categories
      SET name = ?, color = ?, icon = ?
      WHERE id = ?
    `).run(name, color, icon, req.params.id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }

    const category = db.prepare('SELECT * FROM categories WHERE id = ?').get(req.params.id);
    res.json(category);
  } catch (error: any) {
    if (error.message.includes('UNIQUE constraint failed')) {
      return res.status(409).json({ error: 'Category name already exists' });
    }
    res.status(500).json({ error: 'Failed to update category' });
  }
});

// Delete category
categoryRoutes.delete('/:id', (req, res) => {
  try {
    // Check if category has expenses
    const expenseCount = db.prepare('SELECT COUNT(*) as count FROM expenses WHERE category_id = ?').get(req.params.id) as { count: number };
    
    if (expenseCount.count > 0) {
      return res.status(400).json({ error: 'Cannot delete category with existing expenses' });
    }

    const result = db.prepare('DELETE FROM categories WHERE id = ?').run(req.params.id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete category' });
  }
});