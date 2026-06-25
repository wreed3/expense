# Phase 3 Features - Multi-Currency, Tags & Advanced Features

This document describes the new features added in Phase 3 of the Expense Tracker application.

## 🌍 Multi-Currency Support

### Features
- Support for 9 major currencies (USD, EUR, GBP, JPY, CAD, AUD, CHF, CNY, INR)
- Configurable exchange rates
- Set default currency for your account
- Automatic currency conversion in reports
- Per-expense currency tracking

### Usage
1. Go to **Settings > Currencies**
2. Update exchange rates as needed
3. Set your preferred default currency
4. When creating expenses, select the currency used
5. View amounts in their original currency or converted to your default

### API Endpoints
- `GET /api/currencies` - List all currencies
- `GET /api/currencies/default` - Get default currency
- `PUT /api/currencies/:code` - Update exchange rate
- `POST /api/currencies/:code/set-default` - Set as default
- `POST /api/currencies/convert` - Convert between currencies

## 🏷️ Tags System

### Features
- Create unlimited custom tags
- Color-coded tags for visual organization
- Tag multiple expenses at once (bulk tagging)
- Filter expenses by tags
- See tag usage statistics

### Usage
1. Go to **Settings > Tags**
2. Create tags with custom names and colors
3. When creating/editing expenses, select relevant tags
4. Use Advanced Search to filter by tags
5. Bulk tag multiple expenses from the expense list

### API Endpoints
- `GET /api/tags` - List all tags
- `POST /api/tags` - Create new tag
- `PUT /api/tags/:id` - Update tag
- `DELETE /api/tags/:id` - Delete tag

## 📝 Custom Fields

### Features
- Create custom fields for additional expense metadata
- Support for 5 field types:
  - **Text**: Free-form text input
  - **Number**: Numeric values
  - **Date**: Date picker
  - **Boolean**: Yes/no radio buttons
  - **Select**: Dropdown with custom options
- Mark fields as required or optional
- Fields apply to all expenses

### Field Types Examples
- **Text**: Project name, Client name, Notes
- **Number**: Invoice number, Reference ID
- **Date**: Due date, Invoice date
- **Boolean**: Reimbursable, Tax deductible, Personal
- **Select**: Payment method, Department, Location

### Usage
1. Go to **Settings > Custom Fields**
2. Create fields with appropriate types
3. For select fields, add dropdown options
4. Mark required fields with checkbox
5. Fields appear in expense form automatically

### API Endpoints
- `GET /api/custom-fields` - List all custom fields
- `POST /api/custom-fields` - Create new field
- `PUT /api/custom-fields/:id` - Update field
- `DELETE /api/custom-fields/:id` - Delete field

## 🔍 Advanced Search & Filtering

### Features
- Search by description text
- Filter by date range
- Filter by amount range (min/max)
- Filter by category
- Filter by currency
- Filter by tags (multiple)
- Sort by date, amount, description, or category
- Pagination support

### Usage
1. Click **Advanced Search** button on Expenses page
2. Fill in desired filters
3. Click **Apply Filters**
4. Clear filters anytime with **Reset All**

## 📊 Enhanced Expense List

### New Features
- Currency display with symbols
- Tag badges with colors
- Bulk selection checkboxes
- Bulk delete operation
- Bulk tag operation
- Pagination controls
- Filter status indicator

### Bulk Operations
1. Check boxes next to expenses
2. Click **Bulk Actions** button
3. Choose operation (delete or tag)
4. Confirm action

## ⚙️ Settings Page

Centralized settings management with tabs:

### Currencies Tab
- View all supported currencies
- Update exchange rates
- Set default currency

### Tags Tab
- Create and manage tags
- Edit tag names and colors
- View usage statistics

### Custom Fields Tab
- Create custom fields
- Configure field types
- Set required status
- Manage dropdown options

## 🗄️ Database Changes

### New Tables
- `currencies` - Currency definitions and rates
- `tags` - User-created tags
- `expense_tags` - Many-to-many relationship
- `custom_fields` - Field definitions
- `expense_custom_fields` - Field values per expense

### Updated Tables
- `expenses` - Added `currency_code` and `original_amount` columns

### Indexes
- `idx_expenses_user_date`
- `idx_expenses_category`
- `idx_expenses_amount`
- `idx_expense_tags_expense`
- `idx_expense_tags_tag`
- `idx_tags_user`
- `idx_custom_fields_user`

## 🚀 Migration

To apply Phase 3 changes:

```bash
npm run migrate
```

This will:
1. Create new tables
2. Add columns to existing tables
3. Insert default currencies
4. Create performance indexes

## 📖 Documentation

For more details, see:
- [README.md](README.md) - Full application documentation
- [CHANGELOG.md](CHANGELOG.md) - Version history