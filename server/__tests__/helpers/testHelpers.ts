import { testDb } from '../setup';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

/**
 * Create a test user in the database
 */
export async function createTestUser(
  email: string = 'test@example.com',
  password: string = 'password123',
  name: string = 'Test User'
) {
  const hashedPassword = await bcrypt.hash(password, 10);
  
  const result = testDb.prepare(`
    INSERT INTO users (email, password, name)
    VALUES (?, ?, ?)
  `).run(email, hashedPassword, name);

  return {
    id: result.lastInsertRowid as number,
    email,
    name,
    password, // Return plain password for testing
  };
}

/**
 * Generate JWT token for test user
 */
export function generateTestToken(userId: number): string {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET || 'test-secret-key',
    { expiresIn: '1h' }
  );
}

/**
 * Create a test category
 */
export function createTestCategory(
  userId: number,
  name: string = 'Test Category',
  color: string = '#3b82f6'
) {
  const result = testDb.prepare(`
    INSERT INTO categories (user_id, name, color)
    VALUES (?, ?, ?)
  `).run(userId, name, color);

  return {
    id: result.lastInsertRowid as number,
    user_id: userId,
    name,
    color,
  };
}

/**
 * Create a test expense
 */
export function createTestExpense(
  userId: number,
  categoryId: number,
  amount: number = 50.00,
  description: string = 'Test Expense',
  date: string = new Date().toISOString().split('T')[0]
) {
  const result = testDb.prepare(`
    INSERT INTO expenses (user_id, category_id, amount, description, date)
    VALUES (?, ?, ?, ?, ?)
  `).run(userId, categoryId, amount, description, date);

  return {
    id: result.lastInsertRowid as number,
    user_id: userId,
    category_id: categoryId,
    amount,
    description,
    date,
  };
}

/**
 * Create a test budget
 */
export function createTestBudget(
  userId: number,
  categoryId: number,
  amount: number = 1000.00,
  month: string = new Date().toISOString().slice(0, 7)
) {
  const result = testDb.prepare(`
    INSERT INTO budgets (user_id, category_id, amount, month)
    VALUES (?, ?, ?, ?)
  `).run(userId, categoryId, amount, month);

  return {
    id: result.lastInsertRowid as number,
    user_id: userId,
    category_id: categoryId,
    amount,
    month,
  };
}

/**
 * Get all users from test database
 */
export function getAllUsers() {
  return testDb.prepare('SELECT * FROM users').all();
}

/**
 * Get all categories for a user
 */
export function getUserCategories(userId: number) {
  return testDb.prepare('SELECT * FROM categories WHERE user_id = ?').all(userId);
}

/**
 * Get all expenses for a user
 */
export function getUserExpenses(userId: number) {
  return testDb.prepare('SELECT * FROM expenses WHERE user_id = ?').all(userId);
}

/**
 * Get all budgets for a user
 */
export function getUserBudgets(userId: number) {
  return testDb.prepare('SELECT * FROM budgets WHERE user_id = ?').all(userId);
}

/**
 * Clean up test data
 */
export function cleanupTestData() {
  testDb.exec(`
    DELETE FROM expenses;
    DELETE FROM budgets;
    DELETE FROM categories;
    DELETE FROM users;
  `);
}