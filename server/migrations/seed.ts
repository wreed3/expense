import bcrypt from 'bcrypt';
import { getDatabase, initializeDatabase } from '../database/index.js';
import { logger } from '../utils/logger.js';

async function seedDatabase() {
  try {
    logger.info('Starting database seeding...');
    await initializeDatabase();

    const db = getDatabase();

    // Create demo user
    const hashedPassword = await bcrypt.hash('demo123', 10);
    const userResult = db
      .prepare(
        'INSERT INTO users (email, password, name) VALUES (?, ?, ?) ON CONFLICT(email) DO NOTHING'
      )
      .run('demo@example.com', hashedPassword, 'Demo User');

    const userId = userResult.lastInsertRowid || 1;

    // Create default categories
    const categories = [
      { name: 'Food & Dining', color: '#EF4444', icon: 'utensils' },
      { name: 'Transportation', color: '#3B82F6', icon: 'car' },
      { name: 'Shopping', color: '#8B5CF6', icon: 'shopping-bag' },
      { name: 'Entertainment', color: '#EC4899', icon: 'film' },
      { name: 'Bills & Utilities', color: '#F59E0B', icon: 'receipt' },
      { name: 'Healthcare', color: '#10B981', icon: 'heart' },
      { name: 'Other', color: '#6B7280', icon: 'folder' },
    ];

    const categoryStmt = db.prepare(
      'INSERT INTO categories (user_id, name, color, icon) VALUES (?, ?, ?, ?) ON CONFLICT(user_id, name) DO NOTHING'
    );

    for (const category of categories) {
      categoryStmt.run(userId, category.name, category.color, category.icon);
    }

    // Get category IDs
    const categoryIds = db
      .prepare('SELECT id, name FROM categories WHERE user_id = ?')
      .all(userId) as Array<{ id: number; name: string }>;

    // Create sample expenses
    const expenseStmt = db.prepare(
      'INSERT INTO expenses (user_id, category_id, amount, description, date) VALUES (?, ?, ?, ?, ?)'
    );

    const today = new Date();
    const thisMonth = today.toISOString().slice(0, 7);

    const sampleExpenses = [
      {
        category: 'Food & Dining',
        amount: 45.5,
        description: 'Grocery shopping',
        daysAgo: 2,
      },
      {
        category: 'Transportation',
        amount: 60.0,
        description: 'Gas station',
        daysAgo: 5,
      },
      {
        category: 'Shopping',
        amount: 120.0,
        description: 'Clothing store',
        daysAgo: 7,
      },
      {
        category: 'Entertainment',
        amount: 25.0,
        description: 'Movie tickets',
        daysAgo: 10,
      },
      {
        category: 'Bills & Utilities',
        amount: 150.0,
        description: 'Electric bill',
        daysAgo: 15,
      },
    ];

    for (const expense of sampleExpenses) {
      const category = categoryIds.find((c) => c.name === expense.category);
      if (category) {
        const expenseDate = new Date(today);
        expenseDate.setDate(expenseDate.getDate() - expense.daysAgo);
        expenseStmt.run(
          userId,
          category.id,
          expense.amount,
          expense.description,
          expenseDate.toISOString().slice(0, 10)
        );
      }
    }

    // Create sample budgets
    const budgetStmt = db.prepare(
      'INSERT INTO budgets (user_id, category_id, amount, month) VALUES (?, ?, ?, ?) ON CONFLICT(user_id, category_id, month) DO NOTHING'
    );

    for (const category of categoryIds) {
      if (category.name !== 'Other') {
        budgetStmt.run(userId, category.id, 500, thisMonth);
      }
    }

    logger.info('Database seeded successfully');
    logger.info('Demo user credentials:');
    logger.info('  Email: demo@example.com');
    logger.info('  Password: demo123');

    process.exit(0);
  } catch (error) {
    logger.error('Seeding failed:', error);
    process.exit(1);
  }
}

seedDatabase();