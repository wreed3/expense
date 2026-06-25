-- Phase 3: Performance Indexes

-- Expenses table indexes
CREATE INDEX IF NOT EXISTS idx_expenses_user_date ON expenses(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_user_category ON expenses(user_id, category_id);
CREATE INDEX IF NOT EXISTS idx_expenses_user_amount ON expenses(user_id, amount);
CREATE INDEX IF NOT EXISTS idx_expenses_currency ON expenses(currency);
CREATE INDEX IF NOT EXISTS idx_expenses_merchant ON expenses(merchant);
CREATE INDEX IF NOT EXISTS idx_expenses_date_range ON expenses(date, user_id);

-- Full-text search indexes
CREATE INDEX IF NOT EXISTS idx_expenses_description ON expenses(description);
CREATE INDEX IF NOT EXISTS idx_expenses_notes ON expenses(notes);

-- Tags indexes
CREATE INDEX IF NOT EXISTS idx_tags_user ON tags(user_id);
CREATE INDEX IF NOT EXISTS idx_expense_tags_expense ON expense_tags(expense_id);
CREATE INDEX IF NOT EXISTS idx_expense_tags_tag ON expense_tags(tag_id);

-- Custom fields indexes
CREATE INDEX IF NOT EXISTS idx_custom_fields_user ON custom_fields(user_id);
CREATE INDEX IF NOT EXISTS idx_custom_field_values_expense ON custom_field_values(expense_id);
CREATE INDEX IF NOT EXISTS idx_custom_field_values_field ON custom_field_values(custom_field_id);

-- Budgets indexes
CREATE INDEX IF NOT EXISTS idx_budgets_user_period ON budgets(user_id, period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_budgets_category ON budgets(category_id);

-- Income indexes
CREATE INDEX IF NOT EXISTS idx_income_user_date ON income(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_income_category ON income(category_id);

-- Exchange rates indexes
CREATE INDEX IF NOT EXISTS idx_exchange_rates_currencies ON exchange_rates(from_currency, to_currency, date DESC);

-- Saved searches indexes
CREATE INDEX IF NOT EXISTS idx_saved_searches_user ON saved_searches(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_searches_favorite ON saved_searches(user_id, is_favorite);