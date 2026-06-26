import express, { Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { getDatabase } from '../utils/db';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import Database from 'better-sqlite3';
import { Pool } from 'pg';

const router = express.Router();
const DB_TYPE = process.env.DB_TYPE || 'sqlite';

// Validation schemas
const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

// Register endpoint
router.post('/register', async (req, res, next) => {
  try {
    const { email, password, name } = registerSchema.parse(req.body);
    
    const hashedPassword = await bcrypt.hash(password, 10);
    const db = getDatabase();
    
    let userId: number;
    
    if (DB_TYPE === 'postgres') {
      const pool = db as Pool;
      const result = await pool.query(
        'INSERT INTO users (email, password, name) VALUES ($1, $2, $3) RETURNING id',
        [email, hashedPassword, name || null]
      );
      userId = result.rows[0].id;
    } else {
      const sqlite = db as Database.Database;
      const result = sqlite.prepare(
        'INSERT INTO users (email, password, name) VALUES (?, ?, ?)'
      ).run(email, hashedPassword, name || null);
      userId = result.lastInsertRowid as number;
    }
    
    const token = jwt.sign(
      { userId, email, name },
      process.env.JWT_SECRET!,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
    
    res.status(201).json({
      token,
      user: { id: userId, email, name },
    });
  } catch (error) {
    next(error);
  }
});

// Login endpoint
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = loginSchema.parse(req.body);
    
    const db = getDatabase();
    let user: any;
    
    if (DB_TYPE === 'postgres') {
      const pool = db as Pool;
      const result = await pool.query(
        'SELECT * FROM users WHERE email = $1',
        [email]
      );
      user = result.rows[0];
    } else {
      const sqlite = db as Database.Database;
      user = sqlite.prepare('SELECT * FROM users WHERE email = ?').get(email);
    }
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials', code: 'INVALID_CREDENTIALS' });
    }
    
    const isValidPassword = await bcrypt.compare(password, user.password);
    
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials', code: 'INVALID_CREDENTIALS' });
    }
    
    const token = jwt.sign(
      { userId: user.id, email: user.email, name: user.name },
      process.env.JWT_SECRET!,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
    
    res.json({
      token,
      user: { 
        id: user.id, 
        email: user.email, 
        name: user.name 
      },
    });
  } catch (error) {
    next(error);
  }
});

// Get current user endpoint
router.get('/me', authenticateToken, async (req: AuthRequest, res: Response, next) => {
  try {
    const db = getDatabase();
    let user: any;
    
    if (DB_TYPE === 'postgres') {
      const pool = db as Pool;
      const result = await pool.query(
        'SELECT id, email, name, created_at FROM users WHERE id = $1',
        [req.userId]
      );
      user = result.rows[0];
    } else {
      const sqlite = db as Database.Database;
      user = sqlite.prepare(
        'SELECT id, email, name, created_at FROM users WHERE id = ?'
      ).get(req.userId);
    }
    
    if (!user) {
      return res.status(404).json({ error: 'User not found', code: 'USER_NOT_FOUND' });
    }
    
    res.json({ user });
  } catch (error) {
    next(error);
  }
});

export default router;