import express, { Response } from 'express';
import { z } from 'zod';
import { query, get, run } from '../utils/db.js';
import { authenticateToken } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validateRequest.js';
import logger from '../utils/logger.js';
import type {
  AuthRequest,
  Category,
  CreateCategoryBody,
  UpdateCategoryBody,
} from '../types/index.js';

const router = express.Router();

// Validation schemas
const createCategorySchema = z.object({
  name: z.string().min(1, 'Category name is required'),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Color must be a valid hex code'),
  icon: z.string().min(1, 'Icon is required'),
});

const updateCategorySchema = createCategorySchema.partial();

// Get all categories
router.get('/', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const categories = await query<Category>(
      'SELECT * FROM categories WHERE user_id = ? ORDER BY name',
      [req.user.id]
    );

    res.json(categories);
  } catch (error) {
    logger.error('Get categories error:', error);
    res.status(500).json({ message: 'Error fetching categories' });
  }
});

// Get single category
router.get('/:id', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const category = await get<Category>(
      'SELECT * FROM categories WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );

    if (!category) {
      res.status(404).json({ message: 'Category not found' });
      return;
    }

    res.json(category);
  } catch (error) {
    logger.error('Get category error:', error);
    res.status(500).json({ message: 'Error fetching category' });
  }
});

// Create category
router.post(
  '/',
  authenticateToken,
  validateRequest(createCategorySchema),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ message: 'Not authenticated' });
        return;
      }

      const { name, color, icon } = req.body as CreateCategoryBody;

      // Check if category name already exists for this user
      const existing = await get<Category>(
        'SELECT * FROM categories WHERE user_id = ? AND name = ?',
        [req.user.id, name]
      );

      if (existing) {
        res.status(400).json({ message: 'Category with this name already exists' });
        return;
      }

      const result = await query<Category>(
        'INSERT INTO categories (user_id, name, color, icon) VALUES (?, ?, ?, ?) RETURNING *',
        [req.user.id, name, color, icon]
      );

      logger.info('Category created:', { categoryId: result[0].id, userId: req.user.id });
      res.status(201).json(result[0]);
    } catch (error) {
      logger.error('Create category error:', error);
      res.status(500).json({ message: 'Error creating category' });
    }
  }
);

// Update category
router.put(
  '/:id',
  authenticateToken,
  validateRequest(updateCategorySchema),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ message: 'Not authenticated' });
        return;
      }

      const category = await get<Category>(
        'SELECT * FROM categories WHERE id = ? AND user_id = ?',
        [req.params.id, req.user.id]
      );

      if (!category) {
        res.status(404).json({ message: 'Category not found' });
        return;
      }

      const updates = req.body as UpdateCategoryBody;

      // Check for duplicate name if name is being updated
      if (updates.name && updates.name !== category.name) {
        const existing = await get<Category>(
          'SELECT * FROM categories WHERE user_id = ? AND name = ? AND id != ?',
          [req.user.id, updates.name, req.params.id]
        );

        if (existing) {
          res.status(400).json({ message: 'Category with this name already exists' });
          return;
        }
      }

      const result = await query<Category>(
        `UPDATE categories
         SET name = ?, color = ?, icon = ?
         WHERE id = ? AND user_id = ? RETURNING *`,
        [
          updates.name ?? category.name,
          updates.color ?? category.color,
          updates.icon ?? category.icon,
          req.params.id,
          req.user.id,
        ]
      );

      logger.info('Category updated:', { categoryId: req.params.id, userId: req.user.id });
      res.json(result[0]);
    } catch (error) {
      logger.error('Update category error:', error);
      res.status(500).json({ message: 'Error updating category' });
    }
  }
);

// Delete category
router.delete('/:id', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const category = await get<Category>(
      'SELECT * FROM categories WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );

    if (!category) {
      res.status(404).json({ message: 'Category not found' });
      return;
    }

    // Check if category has expenses
    const expenseCount = await get<{ count: number }>(
      'SELECT COUNT(*) as count FROM expenses WHERE category_id = ?',
      [req.params.id]
    );

    if (expenseCount && expenseCount.count > 0) {
      res.status(400).json({
        message: 'Cannot delete category with existing expenses',
      });
      return;
    }

    await run('DELETE FROM categories WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);

    logger.info('Category deleted:', { categoryId: req.params.id, userId: req.user.id });
    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    logger.error('Delete category error:', error);
    res.status(500).json({ message: 'Error deleting category' });
  }
});

export default router;