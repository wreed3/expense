import Database from 'better-sqlite3';

export function up(db: Database.Database): void {
  // Multi-currency support
  db.exec(`
    CREATE TABLE IF NOT EXISTS currencies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      symbol TEXT NOT NULL,
      exchange_rate REAL NOT NULL DEFAULT 1.0,
      is_default INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  // Add currency to expenses
  db.exec(`
    ALTER TABLE expenses ADD COLUMN currency_code TEXT DEFAULT 'USD';
    ALTER TABLE expenses ADD COLUMN original_amount REAL;
  `);

  // Tags system
  db.exec(`
    CREATE TABLE IF NOT EXISTS tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      color TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(user_id, name)
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS expense_tags (
      expense_id INTEGER NOT NULL,
      tag_id INTEGER NOT NULL,
      PRIMARY KEY (expense_id, tag_id),
      FOREIGN KEY (expense_id) REFERENCES expenses(id) ON DELETE CASCADE,
      FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
    );
  `);

  // Custom fields
  db.exec(`
    CREATE TABLE IF NOT EXISTS custom_fields (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      field_type TEXT NOT NULL CHECK(field_type IN ('text', 'number', 'date', 'boolean', 'select')),
      options TEXT,
      is_required INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(user_id, name)
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS expense_custom_fields (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      expense_id INTEGER NOT NULL,
      custom_field_id INTEGER NOT NULL,
      value TEXT,
      FOREIGN KEY (expense_id) REFERENCES expenses(id) ON DELETE CASCADE,
      FOREIGN KEY (custom_field_id) REFERENCES custom_fields(id) ON DELETE CASCADE,
      UNIQUE(expense_id, custom_field_id)
    );
  `);

  // Performance indexes
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_expenses_user_date ON expenses(user_id, date);
    CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category_id);
    CREATE INDEX IF NOT EXISTS idx_expenses_amount ON expenses(amount);
    CREATE INDEX IF NOT EXISTS idx_expense_tags_expense ON expense_tags(expense_id);
    CREATE INDEX IF NOT EXISTS idx_expense_tags_tag ON expense_tags(tag_id);
    CREATE INDEX IF NOT EXISTS idx_tags_user ON tags(user_id);
    CREATE INDEX IF NOT EXISTS idx_custom_fields_user ON custom_fields(user_id);
  `);

  // Insert default currencies
  db.exec(`
    INSERT OR IGNORE INTO currencies (code, name, symbol, is_default) VALUES
      ('USD', 'US Dollar', '$', 1),
      ('EUR', 'Euro', '€', 0),
      ('GBP', 'British Pound', '£', 0),
      ('JPY', 'Japanese Yen', '¥', 0),
      ('CAD', 'Canadian Dollar', 'C$', 0),
      ('AUD', 'Australian Dollar', 'A$', 0),
      ('CHF', 'Swiss Franc', 'CHF', 0),
      ('CNY', 'Chinese Yuan', '¥', 0),
      ('INR', 'Indian Rupee', '₹', 0);
  `);
}

export function down(db: Database.Database): void {
  db.exec('DROP TABLE IF EXISTS expense_custom_fields');
  db.exec('DROP TABLE IF EXISTS custom_fields');
  db.exec('DROP TABLE IF EXISTS expense_tags');
  db.exec('DROP TABLE IF EXISTS tags');
  db.exec('DROP TABLE IF EXISTS currencies');
  
  db.exec(`
    CREATE TABLE expenses_backup AS SELECT 
      id, user_id, amount, category_id, description, date, 
      receipt_path, is_recurring, recurring_frequency, created_at, updated_at
    FROM expenses;
  `);
  
  db.exec('DROP TABLE expenses');
  db.exec('ALTER TABLE expenses_backup RENAME TO expenses');
}