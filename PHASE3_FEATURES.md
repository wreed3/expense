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
- `GET /api/tags/:id/expenses` - Get expenses with tag

## 📝 Custom Fields

### Features
- Create custom fields for additional expense metadata
- Support for 5 field types:
  - Text (free-form text input)
  - Number (numeric values)
  - Date (date picker)
  - Boolean (yes/no radio buttons)
  - Select (dropdown with custom options)
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
6. Data is saved with each expense

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
- Ascending or descending order
- Pagination support

### Usage
1. Click **Advanced Search** button on Expenses page
2. Fill in desired filters
3. Click **Apply Filters**
4. Clear filters anytime with **Reset All**
5. Active filters are highlighted

### Filter Combinations
All filters work together (AND logic):
- Date range + Category + Tags
- Amount range + Currency + Search text
- Any combination of available filters

## 📊 Enhanced Expense List

### New Features
- Currency display with symbols
- Tag badges with colors
- Bulk selection checkboxes
- Bulk delete operation
- Bulk tag operation
- Pagination controls
- Receipt indicator
- Recurring expense badge
- Filter status indicator

### Bulk Operations
1. Check boxes next to expenses
2. Click **Bulk Actions** button
3. Choose operation:
   - Delete selected expenses
   - Add tags to selected expenses
4. Confirm action

## ⚙️ Settings Page

Centralized settings management with tabs:

### Currencies Tab
- View all supported currencies
- Update exchange rates
- Set default currency
- See conversion information

### Tags Tab
- Create and manage tags
- Edit tag names and colors
- View usage statistics
- Delete unused tags

### Custom Fields Tab
- Create custom fields
- Configure field types
- Set required status
- Manage dropdown options
- Delete fields

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
Performance indexes added for:
- `expenses(user_id, date)`
- `expenses(category_id)`
- `expenses(amount)`
- `expense_tags(expense_id)`
- `expense_tags(tag_id)`
- `tags(user_id)`
- `custom_fields(user_id)`

## 🚀 API Enhancements

### Enhanced Expense Endpoints
- `GET /api/expenses` now supports:
  - `start_date`, `end_date` - Date range
  - `category_id` - Filter by category
  - `min_amount`, `max_amount` - Amount range
  - `search` - Text search in descriptions
  - `tags` - Comma-separated tag IDs
  - `currency` - Filter by currency code
  - `sort_by` - Sort field
  - `sort_order` - asc or desc
  - `limit`, `offset` - Pagination

- `POST /api/expenses/bulk/delete` - Delete multiple expenses
- `POST /api/expenses/bulk/tag` - Tag multiple expenses

### Response Format
Expenses now include:
```json
{
  "expenses": [...],
  "pagination": {
    "total": 100,
    "limit": 50,
    "offset": 0,
    "has_more": true
  }
}
```

## 🔄 Migration

Phase 3 features require running migrations:

```bash
npm run migrate
```

This will:
1. Create new tables (currencies, tags, custom_fields, etc.)
2. Add new columns to expenses table
3. Create performance indexes
4. Insert default currencies

To rollback:
```bash
npm run migrate:down 004_phase3_features
```

## 📦 Seed Data

Updated seed script includes:
- 5 sample tags
- 4 custom fields
- Tagged expenses
- Multi-currency expenses

Run with:
```bash
npm run seed
```

## 🎨 UI Components

### New Components
- `CurrencySelector` - Currency dropdown with symbols
- `CurrencySettings` - Manage currencies and rates
- `TagManager` - Create and manage tags
- `TagSelector` - Multi-select tag picker
- `CustomFieldManager` - Manage custom fields
- `CustomFieldInput` - Render field based on type
- `AdvancedSearch` - Comprehensive search modal
- `Settings` - Tabbed settings page

### Updated Components
- `ExpenseForm` - Added currency, tags, custom fields
- `ExpenseList` - Added bulk actions, filters, pagination
- `Navigation` - Added Settings link
- `App` - Added Settings route

## 🔐 Security

All new endpoints are protected with:
- JWT authentication
- User-scoped data (can only access own data)
- Input validation with Zod
- SQL injection prevention (parameterized queries)
- Rate limiting

## 📈 Performance

Phase 3 includes several optimizations:
- Database indexes for common queries
- Efficient bulk operations
- Pagination to reduce data transfer
- Optimized JOIN queries
- Transaction support for data consistency

## 🧪 Testing

To test Phase 3 features:

1. Run migrations: `npm run migrate`
2. Seed database: `npm run seed`
3. Login with: `test@example.com` / `password123`
4. Navigate to Settings to configure:
   - Currencies and exchange rates
   - Tags for categorization
   - Custom fields for metadata
5. Create expenses with new features
6. Use Advanced Search to filter
7. Try bulk operations

## 📝 Notes

- Exchange rates must be updated manually
- Custom fields apply to all expenses
- Deleting a tag removes it from all expenses
- Deleting a custom field removes all associated data
- Currency conversion is done at query time
- Original amounts are preserved in database

## 🐛 Known Limitations

- Exchange rates are not automatically updated
- No support for cryptocurrency
- Custom fields limited to 5 types
- Bulk operations limited to visible expenses
- No field-level permissions

## 🔮 Future Enhancements

Potential improvements for future phases:
- Auto-update exchange rates via API
- Custom field templates
- Field-level validation rules
- Tag hierarchies/categories
- Saved search filters
- Export with custom fields
- Currency conversion history
- Multi-currency budget support