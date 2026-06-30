import { Router, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { getDb } from '../utils/db.js';
import { authenticateToken } from '../middleware/auth.js';
import type { AuthRequest, RegisterBody, LoginBody } from '../types/express.js';

const router: Router = Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

interface User {
  id: number;
  email: string;
  password: string;
  name: string;
  created_at: string;
}

router.post('/register', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { email, password, name } = registerSchema.parse(req.body) as RegisterBody;
    
    const db = getDb();
    
    const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(email) as User | undefined;
    if (existingUser) {
      res.status(400).json({ error: 'User already exists' });
      return;
    }
    
    const hashedPassword: string = await bcrypt.hash(password, 10);
    
    const result = db.prepare(
      'INSERT INTO users (email, password, name) VALUES (?, ?, ?)'
    ).run(email, hashedPassword, name);
    
    const token: string = jwt.sign(
      { userId: result.lastInsertRowid },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );
    
    res.status(201).json({
      token,
      user: {
        id: result.lastInsertRowid,
        email,
        name,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors });
      return;
    }
    res.status(500).json({ error: 'Failed to register user' });
  }
});

router.post('/login', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { email, password } = loginSchema.parse(req.body) as LoginBody;
    
    const db = getDb();
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as User | undefined;
    
    if (!user) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }
    
    const validPassword: boolean = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }
    
    const token: string = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );
    
    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors });
      return;
    }
    res.status(500).json({ error: 'Failed to login' });
  }
});

router.get('/me', authenticateToken, (req: AuthRequest, res: Response): void => {
  try {
    const db = getDb();
    const user = db.prepare('SELECT id, email, name, created_at FROM users WHERE id = ?')
      .get(req.userId) as Omit<User, 'password'> | undefined;
    
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

export default router;