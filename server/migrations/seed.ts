import { db } from '../database.js';
import { logger } from '../logger.js';
import bcrypt from 'bcrypt';

async function seed() {
  logger.info('Starting database seeding...');

  try {
    // Create demo user
    const hashedPassword = await bcrypt.hash('demo123', 10);
    const userResult = await db.execute(
      'INSERT INTO users (email, password, name) VALUES (?, ?, ?)',
      ['demo@example.com', hashedPassword, 'Demo User']
    );
    const userId = userResult.lastID || 1;

    logger.info('Demo user created: demo@example.com / demo123');

    // Create default categories
    const categories = [
      { name: 'Food & Dining', color: '#FF6B6B', icon: '🍔' },
      { name: 'Transportation', color: '#4ECDC4', icon: '🚗' },
      { name: 'Shopping', color: '#45B7D1', icon: '🛍️' },
      { name: 'Entertainment', color: '#96CEB4', icon: '🎬' },
      { name: 'Bills & Utilities', color: '#FFEAA7', icon: '💡' },
      { name: 'Healthcare', color: '#DFE6E9', icon: '⚕️' },
      { name: 'Education', color: '#A29BFE', icon: '📚' },
      { name: 'Other', color: '#B2BEC3', icon: '📌' },
    ];

    for (const category of categories) {
      await db.execute(
        'INSERT INTO categories (user_id, name, color, icon) VALUES (?, ?, ?, ?)',
        [userId, category.name, category.color, category.icon]
      );
    }

    logger.info('Default categories created');

    // Create sample expenses
    const sampleExpenses = [
      { description: 'Grocery shopping', amount: 85.50, category: 'Food & Dining', date: '2024-01-15' },
      { description: 'Gas station', amount: 45.00, category: 'Transportation', date: '2024-01-16' },
      { description: 'Movie tickets', amount: 30.00, category: 'Entertainment', date: '2024-01-17' },
      { description: 'Electricity bill', amount: 120.00, category: 'Bills & Utilities', date: '2024-01-18' },
      { description: 'New shoes', amount: 75.00, category: 'Shopping', date: '2024-01-19' },
    ];

    for (const expense of sampleExpenses) {
      const category = await db.queryOne(
        'SELECT id FROM categories WHERE name = ? AND user_id = ?',
        [expense.category, userId]
      );

      await db.execute(
        'INSERT INTO expenses (user_id, description, amount, category_id, date) VALUES (?, ?, ?, ?, ?)',
        [userId, expense.description, expense.amount, category.id, expense.date]
      );
    }

    logger.info('Sample expenses created');

    // Create sample budget
    const foodCategory = await db.queryOne(
      'SELECT id FROM categories WHERE name = ? AND user_id = ?',
      ['Food & Dining', userId]
    );

    await db.execute(
      'INSERT INTO budgets (user_id, category_id, amount, period, start_date, alert_threshold) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, foodCategory.id, 500, 'monthly', '2024-01-01', 80]
    );

    logger.info('Sample budget created');

    // Create sample tags
    const tags = [
      { name: 'Work', color: '#3498db' },
      { name: 'Personal', color: '#e74c3c' },
      { name: 'Family', color: '#2ecc71' },
    ];

    for (const tag of tags) {
      await db.execute(
        'INSERT INTO tags (user_id, name, color) VALUES (?, ?, ?)',
        [userId, tag.name, tag.color]
      );
    }

    logger.info('Sample tags created');

    logger.info('Database seeding completed successfully!');
  } catch (error) {
    logger.error('Seeding failed:', error);
    throw error;
  }
}

// Run seed if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seed()
    .then(() => process.exit(0))
    .catch((error) => {
      logger.error('Seed failed:', error);
      process.exit(1);
    });
}

export { seed };