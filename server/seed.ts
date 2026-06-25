import Database from 'better-sqlite3';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

async function seed() {
  const dbPath = process.env.DB_PATH || path.join(__dirname, '../expenses.db');
  const db = new Database(dbPath);

  console.log('Seeding database...');

  try {
    // Create test user
    const hashedPassword = await bcrypt.hash('password123', 10);
    const userResult = db.prepare(`
      INSERT OR IGNORE INTO users (email, password, name)
      VALUES (?, ?, ?)
    `).run('test@example.com', hashedPassword, 'Test User');

    const userId = userResult.lastInsertRowid || 1;

    // Create categories
    const categories = [
      { name: 'Food & Dining', color: '#EF4444', icon: '🍔' },
      { name: 'Transportation', color: '#3B82F6', icon: '🚗' },
      { name: 'Shopping', color: '#8B5CF6', icon: '🛍️' },
      { name: 'Entertainment', color: '#EC4899', icon: '🎬' },
      { name: 'Bills & Utilities', color: '#F59E0B', icon: '💡' },
      { name: 'Healthcare', color: '#10B981', icon: '⚕️' },
      { name: 'Education', color: '#6366F1', icon: '📚' },
      { name: 'Travel', color: '#14B8A6', icon: '✈️' },
    ];

    const categoryIds: number[] = [];
    for (const cat of categories) {
      const result = db.prepare(`
        INSERT OR IGNORE INTO categories (user_id, name, color, icon)
        VALUES (?, ?, ?, ?)
      `).run(userId, cat.name, cat.color, cat.icon);
      
      if (result.lastInsertRowid) {
        categoryIds.push(Number(result.lastInsertRowid));
      }
    }

    // Get actual category IDs
    const actualCategories = db.prepare('SELECT id FROM categories WHERE user_id = ?').all(userId) as { id: number }[];
    const actualCategoryIds = actualCategories.map(c => c.id);

    // Create tags
    const tags = [
      { name: 'Business', color: '#3B82F6' },
      { name: 'Personal', color: '#10B981' },
      { name: 'Urgent', color: '#EF4444' },
      { name: 'Recurring', color: '#8B5CF6' },
      { name: 'Tax Deductible', color: '#F59E0B' },
    ];

    const tagIds: number[] = [];
    for (const tag of tags) {
      const result = db.prepare(`
        INSERT OR IGNORE INTO tags (user_id, name, color)
        VALUES (?, ?, ?)
      `).run(userId, tag.name, tag.color);
      
      if (result.lastInsertRowid) {
        tagIds.push(Number(result.lastInsertRowid));
      }
    }

    // Get actual tag IDs
    const actualTags = db.prepare('SELECT id FROM tags WHERE user_id = ?').all(userId) as { id: number }[];
    const actualTagIds = actualTags.map(t => t.id);

    // Create custom fields
    const customFields = [
      { name: 'Project', field_type: 'text', is_required: false },
      { name: 'Client', field_type: 'text', is_required: false },
      { name: 'Payment Method', field_type: 'select', options: JSON.stringify(['Cash', 'Credit Card', 'Debit Card', 'Bank Transfer']), is_required: false },
      { name: 'Reimbursable', field_type: 'boolean', is_required: false },
    ];

    for (const field of customFields) {
      db.prepare(`
        INSERT OR IGNORE INTO custom_fields (user_id, name, field_type, options, is_required)
        VALUES (?, ?, ?, ?, ?)
      `).run(userId, field.name, field.field_type, field.options || null, field.is_required ? 1 : 0);
    }

    // Create sample expenses
    const expenses = [
      { amount: 45.50, categoryIdx: 0, description: 'Lunch at restaurant', days_ago: 1, currency: 'USD' },
      { amount: 120.00, categoryIdx: 1, description: 'Gas station fill-up', days_ago: 2, currency: 'USD' },
      { amount: 89.99, categoryIdx: 2, description: 'Online shopping', days_ago: 3, currency: 'USD' },
      { amount: 25.00, categoryIdx: 3, description: 'Movie tickets', days_ago: 5, currency: 'USD' },
      { amount: 150.00, categoryIdx: 4, description: 'Electricity bill', days_ago: 7, currency: 'USD', recurring: true },
      { amount: 75.00, categoryIdx: 5, description: 'Doctor visit copay', days_ago: 10, currency: 'USD' },
      { amount: 200.00, categoryIdx: 6, description: 'Online course', days_ago: 14, currency: 'USD' },
      { amount: 500.00, categoryIdx: 7, description: 'Flight tickets', days_ago: 20, currency: 'USD' },
      { amount: 35.00, categoryIdx: 0, description: 'Grocery shopping', days_ago: 1, currency: 'USD' },
      { amount: 60.00, categoryIdx: 1, description: 'Uber rides', days_ago: 3, currency: 'USD' },
    ];

    const expenseIds: number[] = [];
    for (const expense of expenses) {
      const date = new Date();
      date.setDate(date.getDate() - expense.days_ago);
      
      const categoryId = actualCategoryIds[expense.categoryIdx % actualCategoryIds.length];
      
      const result = db.prepare(`
        INSERT INTO expenses (
          user_id, amount, category_id, description, date, 
          is_recurring, recurring_frequency, currency_code, original_amount
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        userId,
        expense.amount,
        categoryId,
        expense.description,
        date.toISOString(),
        expense.recurring ? 1 : 0,
        expense.recurring ? 'monthly' : null,
        expense.currency,
        expense.amount
      );

      if (result.lastInsertRowid) {
        expenseIds.push(Number(result.lastInsertRowid));
      }
    }

    // Add tags to some expenses
    if (expenseIds.length > 0 && actualTagIds.length > 0) {
      for (let i = 0; i < Math.min(5, expenseIds.length); i++) {
        const tagId = actualTagIds[i % actualTagIds.length];
        db.prepare(`
          INSERT OR IGNORE INTO expense_tags (expense_id, tag_id)
          VALUES (?, ?)
        `).run(expenseIds[i], tagId);
      }
    }

    // Create budgets
    const budgets = [
      { categoryIdx: 0, amount: 500, period: 'monthly' },
      { categoryIdx: 1, amount: 300, period: 'monthly' },
      { categoryIdx: 2, amount: 200, period: 'monthly' },
      { categoryIdx: 3, amount: 150, period: 'monthly' },
    ];

    for (const budget of budgets) {
      const categoryId = actualCategoryIds[budget.categoryIdx % actualCategoryIds.length];
      const startDate = new Date();
      startDate.setDate(1); // First day of current month
      
      db.prepare(`
        INSERT OR IGNORE INTO budgets (user_id, category_id, amount, period, start_date)
        VALUES (?, ?, ?, ?, ?)
      `).run(userId, categoryId, budget.amount, budget.period, startDate.toISOString());
    }

    console.log('✓ Database seeded successfully!');
    console.log('\nTest account credentials:');
    console.log('Email: test@example.com');
    console.log('Password: password123');
    console.log(`\nCreated:`);
    console.log(`- ${actualCategoryIds.length} categories`);
    console.log(`- ${actualTagIds.length} tags`);
    console.log(`- ${customFields.length} custom fields`);
    console.log(`- ${expenseIds.length} sample expenses`);
    console.log(`- ${budgets.length} budgets`);

  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  } finally {
    db.close();
  }
}

seed();