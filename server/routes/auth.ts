import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { getDatabase } from '../database/index.js';
import { AppError, asyncHandler } from '../middleware/errorHandler.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';

const router = express.Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

// Register
router.post(
  '/register',
  asyncHandler(async (req, res) => {
    const { email, password, name } = registerSchema.parse(req.body);

    const db = getDatabase();

    // Check if user exists
    const existingUser = db
      .prepare('SELECT id FROM users WHERE email = ?')
      .get(email);

    if (existingUser) {
      throw new AppError('User already exists', 400);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const result = db
      .prepare('INSERT INTO users (email, password, name) VALUES (?, ?, ?)')
      .run(email, hashedPassword, name);

    const userId = result.lastInsertRowid;

    // Create default categories for new user
    const defaultCategories = [
      { name: 'Food & Dining', color: '#EF4444', icon: 'utensils' },
      { name: 'Transportation', color: '#3B82F6', icon: 'car' },
      { name: 'Shopping', color: '#8B5CF6', icon: 'shopping-bag' },
      { name: 'Entertainment', color: '#EC4899', icon: 'film' },
      { name: 'Bills & Utilities', color: '#F59E0B', icon: 'receipt' },
      { name: 'Healthcare', color: '#10B981', icon: 'heart' },
      { name: 'Other', color: '#6B7280', icon: 'folder' },
    ];

    const categoryStmt = db.prepare(
      'INSERT INTO categories (user_id, name, color, icon) VALUES (?, ?, ?, ?)'
    );

    for (const category of defaultCategories) {
      categoryStmt.run(userId, category.name, category.color, category.icon);
    }

    // Generate token
    const token = jwt.sign({ userId }, process.env.JWT_SECRET!, {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    });

    res.status(201).json({
      token,
      user: {
        id: userId,
        email,
        name,
      },
    });
  })
);

// Login
router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const { email, password } = loginSchema.parse(req.body);

    const db = getDatabase();

    // Find user
    const user = db
      .prepare('SELECT * FROM users WHERE email = ?')
      .get(email) as any;

    if (!user) {
      throw new AppError('Invalid credentials', 401);
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      throw new AppError('Invalid credentials', 401);
    }

    // Generate token
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!, {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    });

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
  })
);

// Get current user
router.get(
  '/me',
  authenticate,
  asyncHandler(async (req: AuthRequest, res) => {
    const db = getDatabase();

    const user = db
      .prepare('SELECT id, email, name, created_at FROM users WHERE id = ?')
      .get(req.userId!) as any;

    if (!user) {
      throw new AppError('User not found', 404);
    }

    res.json(user);
  })
);

export default router;