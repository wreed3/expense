-- Phase 3: Multi-Currency Support and Tags System

-- Currency support
CREATE TABLE IF NOT EXISTS currencies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code VARCHAR(3) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  symbol VARCHAR(10) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS exchange_rates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  from_currency VARCHAR(3) NOT NULL,
  to_currency VARCHAR(3) NOT NULL,
  rate DECIMAL(20, 8) NOT NULL,
  date DATE NOT NULL,
  source VARCHAR(50) DEFAULT 'manual',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(from_currency, to_currency, date)
);

-- Add currency fields to expenses
ALTER TABLE expenses ADD COLUMN currency VARCHAR(3) DEFAULT 'USD';
ALTER TABLE expenses ADD COLUMN original_amount DECIMAL(10, 2);
ALTER TABLE expenses ADD COLUMN exchange_rate DECIMAL(20, 8) DEFAULT 1.0;

-- Tags system
CREATE TABLE IF NOT EXISTS tags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  name VARCHAR(50) NOT NULL,
  color VARCHAR(7) DEFAULT '#3B82F6',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(user_id, name)
);

CREATE TABLE IF NOT EXISTS expense_tags (
  expense_id INTEGER NOT NULL,
  tag_id INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (expense_id, tag_id),
  FOREIGN KEY (expense_id) REFERENCES expenses(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

-- Custom fields system
CREATE TABLE IF NOT EXISTS custom_fields (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  name VARCHAR(100) NOT NULL,
  field_type VARCHAR(20) NOT NULL CHECK(field_type IN ('text', 'number', 'date', 'boolean', 'select')),
  options TEXT, -- JSON array for select type
  is_required BOOLEAN DEFAULT false,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(user_id, name)
);

CREATE TABLE IF NOT EXISTS expense_custom_fields (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  expense_id INTEGER NOT NULL,
  custom_field_id INTEGER NOT NULL,
  value TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (expense_id) REFERENCES expenses(id) ON DELETE CASCADE,
  FOREIGN KEY (custom_field_id) REFERENCES custom_fields(id) ON DELETE CASCADE,
  UNIQUE(expense_id, custom_field_id)
);

-- Saved searches
CREATE TABLE IF NOT EXISTS saved_searches (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  filters TEXT NOT NULL, -- JSON object with filter criteria
  is_favorite BOOLEAN DEFAULT false,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_expenses_user_date ON expenses(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category_id);
CREATE INDEX IF NOT EXISTS idx_expenses_currency ON expenses(currency);
CREATE INDEX IF NOT EXISTS idx_expenses_amount ON expenses(amount);
CREATE INDEX IF NOT EXISTS idx_expense_tags_expense ON expense_tags(expense_id);
CREATE INDEX IF NOT EXISTS idx_expense_tags_tag ON expense_tags(tag_id);
CREATE INDEX IF NOT EXISTS idx_exchange_rates_lookup ON exchange_rates(from_currency, to_currency, date DESC);
CREATE INDEX IF NOT EXISTS idx_custom_fields_user ON custom_fields(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_searches_user ON saved_searches(user_id);

-- Full-text search support (SQLite FTS5)
CREATE VIRTUAL TABLE IF NOT EXISTS expenses_fts USING fts5(
  expense_id UNINDEXED,
  description,
  notes,
  merchant,
  content=expenses,
  content_rowid=id
);

-- Triggers to keep FTS table in sync
CREATE TRIGGER IF NOT EXISTS expenses_fts_insert AFTER INSERT ON expenses BEGIN
  INSERT INTO expenses_fts(expense_id, description, notes, merchant)
  VALUES (new.id, new.description, new.notes, COALESCE(new.merchant, ''));
END;

CREATE TRIGGER IF NOT EXISTS expenses_fts_update AFTER UPDATE ON expenses BEGIN
  DELETE FROM expenses_fts WHERE expense_id = old.id;
  INSERT INTO expenses_fts(expense_id, description, notes, merchant)
  VALUES (new.id, new.description, new.notes, COALESCE(new.merchant, ''));
END;

CREATE TRIGGER IF NOT EXISTS expenses_fts_delete AFTER DELETE ON expenses BEGIN
  DELETE FROM expenses_fts WHERE expense_id = old.id;
END;

-- Insert common currencies
INSERT OR IGNORE INTO currencies (code, name, symbol) VALUES
  ('USD', 'US Dollar', '$'),
  ('EUR', 'Euro', '€'),
  ('GBP', 'British Pound', '£'),
  ('JPY', 'Japanese Yen', '¥'),
  ('CAD', 'Canadian Dollar', 'C$'),
  ('AUD', 'Australian Dollar', 'A$'),
  ('CHF', 'Swiss Franc', 'CHF'),
  ('CNY', 'Chinese Yuan', '¥'),
  ('INR', 'Indian Rupee', '₹'),
  ('MXN', 'Mexican Peso', '$');