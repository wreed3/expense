-- Add multi-currency support
CREATE TABLE IF NOT EXISTS currencies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  symbol TEXT NOT NULL,
  exchange_rate REAL NOT NULL DEFAULT 1.0,
  is_base BOOLEAN NOT NULL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Add currency column to expenses
ALTER TABLE expenses ADD COLUMN currency_code TEXT DEFAULT 'USD';
ALTER TABLE expenses ADD COLUMN original_amount REAL;

-- Add currency column to budgets
ALTER TABLE budgets ADD COLUMN currency_code TEXT DEFAULT 'USD';

-- Add currency column to income
ALTER TABLE income ADD COLUMN currency_code TEXT DEFAULT 'USD';
ALTER TABLE income ADD COLUMN original_amount REAL;

-- Insert default currencies
INSERT INTO currencies (code, name, symbol, exchange_rate, is_base) VALUES
  ('USD', 'US Dollar', '$', 1.0, 1),
  ('EUR', 'Euro', '€', 0.92, 0),
  ('GBP', 'British Pound', '£', 0.79, 0),
  ('JPY', 'Japanese Yen', '¥', 149.50, 0),
  ('CAD', 'Canadian Dollar', 'C$', 1.35, 0),
  ('AUD', 'Australian Dollar', 'A$', 1.52, 0),
  ('CHF', 'Swiss Franc', 'CHF', 0.88, 0),
  ('CNY', 'Chinese Yuan', '¥', 7.24, 0),
  ('INR', 'Indian Rupee', '₹', 83.12, 0);

-- Create index for currency lookups
CREATE INDEX idx_expenses_currency ON expenses(currency_code);
CREATE INDEX idx_budgets_currency ON budgets(currency_code);
CREATE INDEX idx_income_currency ON income(currency_code);