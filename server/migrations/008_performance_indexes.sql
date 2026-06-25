-- Add performance indexes for common queries

-- Expenses indexes
CREATE INDEX IF NOT EXISTS idx_expenses_user_date ON expenses(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_user_category ON expenses(user_id, category_id);
CREATE INDEX IF NOT EXISTS idx_expenses_user_amount ON expenses(user_id, amount);
CREATE INDEX IF NOT EXISTS idx_expenses_date_range ON expenses(date, user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_payment_method ON expenses(payment_method);
CREATE INDEX IF NOT EXISTS idx_expenses_recurring ON expenses(is_recurring, user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_receipt ON expenses(receipt_path) WHERE receipt_path IS NOT NULL;

-- Income indexes
CREATE INDEX IF NOT EXISTS idx_income_user_date ON income(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_income_user_source ON income(user_id, source);

-- Budget indexes
CREATE INDEX IF NOT EXISTS idx_budgets_user_month ON budgets(user_id, month);
CREATE INDEX IF NOT EXISTS idx_budgets_category ON budgets(category_id);

-- Tag indexes (already created in migration 007, but ensuring they exist)
CREATE INDEX IF NOT EXISTS idx_tags_user_name ON tags(user_id, name);
CREATE INDEX IF NOT EXISTS idx_expense_tags_composite ON expense_tags(expense_id, tag_id);

-- Custom field indexes (already created in migration 007, but ensuring they exist)
CREATE INDEX IF NOT EXISTS idx_custom_fields_user_name ON custom_fields(user_id, name);
CREATE INDEX IF NOT EXISTS idx_expense_custom_values_composite ON expense_custom_field_values(expense_id, custom_field_id);
CREATE INDEX IF NOT EXISTS idx_expense_custom_values_field ON expense_custom_field_values(custom_field_id);

-- Currency indexes (already created in migration 006, but ensuring they exist)
CREATE INDEX IF NOT EXISTS idx_currencies_code ON currencies(code);
CREATE INDEX IF NOT EXISTS idx_currencies_base ON currencies(is_base) WHERE is_base = 1;

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_expenses_user_category_date ON expenses(user_id, category_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_user_currency_date ON expenses(user_id, currency_code, date DESC);

-- Full-text search index for descriptions and notes
CREATE INDEX IF NOT EXISTS idx_expenses_description ON expenses(description);
CREATE INDEX IF NOT EXISTS idx_expenses_notes ON expenses(notes) WHERE notes IS NOT NULL;