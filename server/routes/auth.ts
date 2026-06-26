import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { db } from '../db';
import { config } from '../config';
import { authenticate } from '../middleware/auth';
import { z } from 'zod';

const router = Router();

const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(1, 'Name is required'),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

// Register
router.post('/register', async (req, res, next) => {
  try {
    const validated = registerSchema.parse(req.body);
    
    // Check if user exists
    const existingUser = db.prepare('SELECT * FROM users WHERE email = ?').get(validated.email);
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(validated.password, 10);
    
    // Create user
    const result = db.prepare(`
      INSERT INTO users (email, password, name)
      VALUES (?, ?, ?)
    `).run(validated.email, hashedPassword, validated.name);
    
    const user = db.prepare('SELECT id, email, name, created_at FROM users WHERE id = ?').get(result.lastInsertRowid);
    
    // Generate token
    const token = jwt.sign({ userId: user.id }, config.jwtSecret, {
      expiresIn: config.jwtExpiresIn,
    });
    
    res.status(201).json({ user, token });
  } catch (error) {
    next(error);
  }
});

// Login
router.post('/login', async (req, res, next) => {
  try {
    const validated = loginSchema.parse(req.body);
    
    // Find user
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(validated.email) as any;
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Check password
    const isValid = await bcrypt.compare(validated.password, user.password);
    if (!isValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Generate token
    const token = jwt.sign({ userId: user.id }, config.jwtSecret, {
      expiresIn: config.jwtExpiresIn,
    });
    
    const { password, ...userWithoutPassword } = user;
    res.json({ user: userWithoutPassword, token });
  } catch (error) {
    next(error);
  }
});

// Get current user
router.get('/me', authenticate, (req, res) => {
  res.json(req.user);
});

export default router;