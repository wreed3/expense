import bcrypt from 'bcrypt';
import { initDatabase, getDb } from '../utils/db.js';
import { logger } from '../utils/logger.js';

const seed = async () => {
  try {
    logger.info('Starting database seeding...');
    
    await initDatabase();
    const db = getDb();

    // Create demo user
    const hashedPassword = await bcrypt.hash('demo123', 10);
    const userResult = db.prepare(
      'INSERT INTO users (email, password, name) VALUES (?, ?, ?)'
    ).run('demo@example.com', hashedPassword, 'Demo User');

    const userId = userResult.lastInsertRowid;
    logger.info(`Created demo user with ID: ${userId}`);

    // Create categories
    const categories = [
      { name: 'Food & Dining', color: '#FF6B6B' },
      { name: 'Transportation', color: '#4ECDC4' },
      { name: 'Shopping', color: '#45B7D1' },
      { name: 'Entertainment', color: '#FFA07A' },
      { name: 'Bills & Utilities', color: '#98D8C8' },
      { name: 'Healthcare', color: '#F7DC6F' }
    ];

    const categoryIds: number[] = [];
    for (const cat of categories) {
      const result = db.prepare(
        'INSERT INTO categories (user_id, name, color) VALUES (?, ?, ?)'
      ).run(userId, cat.name, cat.color);
      categoryIds.push(Number(result.lastInsertRowid));
    }
    logger.info(`Created ${categories.length} categories`);

    // Create sample expenses
    const expenses = [
      { amount: 45.50, description: 'Grocery shopping', category: 0, date: '2024-01-15', notes: 'Weekly groceries' },
      { amount: 12.00, description: 'Bus fare', category: 1, date: '2024-01-16', notes: null },
      { amount: 89.99, description: 'New shoes', category: 2, date: '2024-01-17', notes: 'Winter boots' },
      { amount: 25.00, description: 'Movie tickets', category: 3, date: '2024-01-18', notes: 'Date night' },
      { amount: 150.00, description: 'Electric bill', category: 4, date: '2024-01-20', notes: null },
      { amount: 35.75, description: 'Restaurant dinner', category: 0, date: '2024-01-21', notes: 'Italian restaurant' }
    ];

    for (const exp of expenses) {
      db.prepare(
        'INSERT INTO expenses (user_id, category_id, amount, description, date, notes) VALUES (?, ?, ?, ?, ?, ?)'
      ).run(userId, categoryIds[exp.category], exp.amount, exp.description, exp.date, exp.notes);
    }
    logger.info(`Created ${expenses.length} sample expenses`);

    // Create sample budgets
    const budgets = [
      { category: 0, amount: 500, month: '2024-01' },
      { category: 1, amount: 200, month: '2024-01' },
      { category: 2, amount: 300, month: '2024-01' }
    ];

    for (const budget of budgets) {
      db.prepare(
        'INSERT INTO budgets (user_id, category_id, amount, month) VALUES (?, ?, ?, ?)'
      ).run(userId, categoryIds[budget.category], budget.amount, budget.month);
    }
    logger.info(`Created ${budgets.length} sample budgets`);

    logger.info('Database seeding completed successfully');
    logger.info('Demo credentials: demo@example.com / demo123');
    
    process.exit(0);
  } catch (error) {
    logger.error('Seeding failed:', error);
    process.exit(1);
  }
};

seed();