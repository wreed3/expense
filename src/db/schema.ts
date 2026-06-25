import { pgTable, serial, text, numeric, timestamp, boolean, varchar, integer, pgEnum, jsonb, date, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const incomeFrequencyEnum = pgEnum('income_frequency', ['one-time', 'weekly', 'bi-weekly', 'monthly', 'quarterly', 'annually']);
export const importStatusEnum = pgEnum('import_status', ['pending', 'processing', 'completed', 'failed']);
export const customFieldTypeEnum = pgEnum('custom_field_type', ['text', 'number', 'date', 'select', 'boolean']);

// Users table
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: varchar('password', { length: 255 }).notNull(),
  name: varchar('name', { length: 255 }),
  defaultCurrency: varchar('default_currency', { length: 3 }).notNull().default('USD'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  emailIdx: index('users_email_idx').on(table.email),
}));

// Currencies table
export const currencies = pgTable('currencies', {
  code: varchar('code', { length: 3 }).primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  symbol: varchar('symbol', { length: 10 }).notNull(),
  decimalPlaces: integer('decimal_places').notNull().default(2),
  isActive: boolean('is_active').notNull().default(true),
});

// Exchange rates table
export const exchangeRates = pgTable('exchange_rates', {
  id: serial('id').primaryKey(),
  fromCurrency: varchar('from_currency', { length: 3 }).notNull().references(() => currencies.code),
  toCurrency: varchar('to_currency', { length: 3 }).notNull().references(() => currencies.code),
  rate: numeric('rate', { precision: 12, scale: 6 }).notNull(),
  date: date('date').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  currencyDateIdx: uniqueIndex('exchange_rates_currency_date_idx').on(table.fromCurrency, table.toCurrency, table.date),
  dateIdx: index('exchange_rates_date_idx').on(table.date),
}));

// Categories table
export const categories = pgTable('categories', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 100 }).notNull(),
  icon: varchar('icon', { length: 50 }),
  color: varchar('color', { length: 7 }),
  isDefault: boolean('is_default').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('categories_user_id_idx').on(table.userId),
}));

// Tags table
export const tags = pgTable('tags', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 50 }).notNull(),
  color: varchar('color', { length: 7 }).notNull().default('#3B82F6'),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('tags_user_id_idx').on(table.userId),
  userNameIdx: uniqueIndex('tags_user_name_idx').on(table.userId, table.name),
}));

// Custom fields table
export const customFields = pgTable('custom_fields', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 100 }).notNull(),
  fieldType: customFieldTypeEnum('field_type').notNull(),
  options: jsonb('options'), // For select type fields
  isRequired: boolean('is_required').notNull().default(false),
  defaultValue: text('default_value'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('custom_fields_user_id_idx').on(table.userId),
}));

// Expenses table (updated)
export const expenses = pgTable('expenses', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
  originalAmount: numeric('original_amount', { precision: 12, scale: 2 }),
  currency: varchar('currency', { length: 3 }).notNull().default('USD').references(() => currencies.code),
  category: varchar('category', { length: 100 }).notNull(),
  description: varchar('description', { length: 500 }),
  notes: text('notes'),
  date: timestamp('date').notNull(),
  receiptUrl: varchar('receipt_url', { length: 500 }),
  isRecurring: boolean('is_recurring').notNull().default(false),
  recurringFrequency: varchar('recurring_frequency', { length: 20 }),
  merchant: varchar('merchant', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  userIdDateIdx: index('expenses_user_id_date_idx').on(table.userId, table.date),
  userIdCategoryIdx: index('expenses_user_id_category_idx').on(table.userId, table.category),
  userIdAmountIdx: index('expenses_user_id_amount_idx').on(table.userId, table.amount),
  dateIdx: index('expenses_date_idx').on(table.date),
  merchantIdx: index('expenses_merchant_idx').on(table.merchant),
}));

// Expense tags junction table
export const expenseTags = pgTable('expense_tags', {
  expenseId: integer('expense_id').notNull().references(() => expenses.id, { onDelete: 'cascade' }),
  tagId: integer('tag_id').notNull().references(() => tags.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  pk: uniqueIndex('expense_tags_pk').on(table.expenseId, table.tagId),
  expenseIdIdx: index('expense_tags_expense_id_idx').on(table.expenseId),
  tagIdIdx: index('expense_tags_tag_id_idx').on(table.tagId),
}));

// Expense custom values table
export const expenseCustomValues = pgTable('expense_custom_values', {
  expenseId: integer('expense_id').notNull().references(() => expenses.id, { onDelete: 'cascade' }),
  fieldId: integer('field_id').notNull().references(() => customFields.id, { onDelete: 'cascade' }),
  value: text('value'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  pk: uniqueIndex('expense_custom_values_pk').on(table.expenseId, table.fieldId),
  expenseIdIdx: index('expense_custom_values_expense_id_idx').on(table.expenseId),
}));

// Budgets table
export const budgets = pgTable('budgets', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  category: varchar('category', { length: 100 }).notNull(),
  amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
  period: varchar('period', { length: 20 }).notNull().default('monthly'),
  startDate: timestamp('start_date').notNull(),
  endDate: timestamp('end_date'),
  isActive: boolean('is_active').notNull().default(true),
  alertThreshold: integer('alert_threshold').default(80),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  userIdCategoryIdx: index('budgets_user_id_category_idx').on(table.userId, table.category),
  activeIdx: index('budgets_active_idx').on(table.isActive),
}));

// Income sources table
export const incomeSources = pgTable('income_sources', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
  frequency: incomeFrequencyEnum('frequency').notNull().default('monthly'),
  category: varchar('category', { length: 100 }).notNull(),
  startDate: timestamp('start_date').notNull(),
  endDate: timestamp('end_date'),
  isActive: boolean('is_active').notNull().default(true),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('income_sources_user_id_idx').on(table.userId),
}));

// Income records table
export const incomeRecords = pgTable('income_records', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  sourceId: integer('source_id').references(() => incomeSources.id, { onDelete: 'set null' }),
  amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
  category: varchar('category', { length: 100 }).notNull(),
  date: timestamp('date').notNull(),
  description: varchar('description', { length: 500 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  userIdDateIdx: index('income_records_user_id_date_idx').on(table.userId, table.date),
}));

// CSV imports table
export const csvImports = pgTable('csv_imports', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  fileName: varchar('file_name', { length: 255 }).notNull(),
  status: importStatusEnum('status').notNull().default('pending'),
  totalRecords: integer('total_records').default(0),
  successfulRecords: integer('successful_records').default(0),
  failedRecords: integer('failed_records').default(0),
  errorLog: text('error_log'),
  importedAt: timestamp('imported_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('csv_imports_user_id_idx').on(table.userId),
}));

// Import mappings table
export const importMappings = pgTable('import_mappings', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  bankName: varchar('bank_name', { length: 255 }).notNull(),
  dateColumn: varchar('date_column', { length: 100 }).notNull(),
  descriptionColumn: varchar('description_column', { length: 100 }).notNull(),
  amountColumn: varchar('amount_column', { length: 100 }).notNull(),
  categoryColumn: varchar('category_column', { length: 100 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  userIdBankIdx: uniqueIndex('import_mappings_user_bank_idx').on(table.userId, table.bankName),
}));

// Saved searches table
export const savedSearches = pgTable('saved_searches', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 100 }).notNull(),
  query: jsonb('query').notNull(),
  isFavorite: boolean('is_favorite').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('saved_searches_user_id_idx').on(table.userId),
}));

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  expenses: many(expenses),
  categories: many(categories),
  budgets: many(budgets),
  tags: many(tags),
  customFields: many(customFields),
  incomeSources: many(incomeSources),
  incomeRecords: many(incomeRecords),
}));

export const tagsRelations = relations(tags, ({ one, many }) => ({
  user: one(users, {
    fields: [tags.userId],
    references: [users.id],
  }),
  expenseTags: many(expenseTags),
}));

export const expensesRelations = relations(expenses, ({ one, many }) => ({
  user: one(users, {
    fields: [expenses.userId],
    references: [users.id],
  }),
  currency: one(currencies, {
    fields: [expenses.currency],
    references: [currencies.code],
  }),
  expenseTags: many(expenseTags),
  customValues: many(expenseCustomValues),
}));

export const expenseTagsRelations = relations(expenseTags, ({ one }) => ({
  expense: one(expenses, {
    fields: [expenseTags.expenseId],
    references: [expenses.id],
  }),
  tag: one(tags, {
    fields: [expenseTags.tagId],
    references: [tags.id],
  }),
}));

export const customFieldsRelations = relations(customFields, ({ one, many }) => ({
  user: one(users, {
    fields: [customFields.userId],
    references: [users.id],
  }),
  values: many(expenseCustomValues),
}));

export const expenseCustomValuesRelations = relations(expenseCustomValues, ({ one }) => ({
  expense: one(expenses, {
    fields: [expenseCustomValues.expenseId],
    references: [expenses.id],
  }),
  field: one(customFields, {
    fields: [expenseCustomValues.fieldId],
    references: [customFields.id],
  }),
}));

export const exchangeRatesRelations = relations(exchangeRates, ({ one }) => ({
  fromCurrencyRelation: one(currencies, {
    fields: [exchangeRates.fromCurrency],
    references: [currencies.code],
    relationName: 'from',
  }),
  toCurrencyRelation: one(currencies, {
    fields: [exchangeRates.toCurrency],
    references: [currencies.code],
    relationName: 'to',
  }),
}));