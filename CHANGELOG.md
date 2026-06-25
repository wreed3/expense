# Changelog

All notable changes to the Expense Tracker project will be documented in this file.

## [2.0.0] - 2025-01-15

### Phase 4: Advanced Analytics & Data Management

#### Added - Analytics
- **Spending Trends & Forecasting**: View historical spending and predict future expenses using linear regression
- **Category Comparison**: Compare spending across top categories with monthly breakdowns
- **Budget Performance Analysis**: Real-time budget tracking with status indicators
- **Spending Heatmap**: Visual calendar showing daily spending patterns
- **Top Expenses**: List of highest expenses with filtering options
- **Month-over-Month Comparison**: Compare current month to previous with percentage changes
- **Smart Insights**: AI-powered spending recommendations and pattern detection

#### Added - Data Management
- **CSV/Excel Import**: Import expenses from spreadsheet files with validation
- **Excel Export**: Export expenses with professional formatting and summary sheets
- **Full Backup**: Complete JSON backup of all user data
- **Restore Functionality**: Restore data from backup files
- **Import Template**: Downloadable template for correct import format
- **Validation System**: Comprehensive error checking for imports

#### Added - UI/UX
- **Mobile-Responsive Design**: Optimized layouts for all screen sizes
- **Grid/List Toggle**: Switch between card and table views
- **Mobile Navigation**: Hamburger menu with slide-out drawer
- **Loading States**: Clear feedback during operations
- **Empty States**: Helpful messages when no data exists
- **Touch-Friendly**: Large touch targets for mobile devices

#### Added - API Endpoints
- `GET /api/analytics-advanced/trends` - Spending trends
- `GET /api/analytics-advanced/category-comparison` - Category analysis
- `GET /api/analytics-advanced/budget-performance` - Budget metrics
- `GET /api/analytics-advanced/heatmap` - Daily spending heatmap
- `GET /api/analytics-advanced/top-expenses` - Highest expenses
- `GET /api/analytics-advanced/month-comparison` - Monthly comparison
- `GET /api/analytics-advanced/insights` - Smart insights
- `POST /api/import-export/import` - Import expenses
- `GET /api/import-export/export/excel` - Export to Excel
- `GET /api/import-export/backup` - Create backup
- `POST /api/import-export/restore` - Restore backup
- `GET /api/import-export/template` - Download template

#### Changed
- Enhanced Dashboard with smart insights and trend widgets
- Improved ExpenseList with mobile-optimized card view
- Updated Analytics page with tabbed interface
- Enhanced Navigation with mobile menu
- Improved error handling and user feedback

#### Dependencies
- Added `xlsx@0.18.5` for Excel file handling
- Added `csv-parse@5.5.3` for CSV parsing

### Phase 3: Multi-Currency, Tags & Custom Fields

#### Added - Multi-Currency
- Support for 9 major currencies (USD, EUR, GBP, JPY, CAD, AUD, CHF, CNY, INR)
- Configurable exchange rates
- Default currency setting
- Automatic currency conversion
- Per-expense currency tracking

#### Added - Tags System
- Create unlimited custom tags
- Color-coded tag organization
- Bulk tagging operations
- Tag filtering and search
- Usage statistics

#### Added - Custom Fields
- 5 field types: text, number, date, boolean, select
- Required/optional field configuration
- Custom field values per expense
- Field management interface

#### Added - Advanced Features
- Enhanced search and filtering
- Bulk operations (delete, tag)
- Pagination support
- Settings page with tabs

#### Added - Database Schema
- `currencies` table with exchange rates
- `tags` table with user-created tags
- `expense_tags` junction table
- `custom_fields` table with field definitions
- `expense_custom_fields` table for field values
- Performance indexes on key columns

#### Added - API Endpoints
- `GET /api/currencies` - List currencies
- `PUT /api/currencies/:code` - Update exchange rate
- `POST /api/currencies/:code/set-default` - Set default
- `POST /api/currencies/convert` - Convert amounts
- `GET /api/tags` - List tags
- `POST /api/tags` - Create tag
- `PUT /api/tags/:id` - Update tag
- `DELETE /api/tags/:id` - Delete tag
- `GET /api/custom-fields` - List custom fields
- `POST /api/custom-fields` - Create field
- `PUT /api/custom-fields/:id` - Update field
- `DELETE /api/custom-fields/:id` - Delete field

#### Changed
- Enhanced expense form with currency selector, tags, and custom fields
- Updated expense list with filtering and bulk operations
- Improved search with multiple filter criteria
- Added settings page with currency, tag, and field management

## [1.0.0] - 2024-12-01

### Initial Release

#### Core Features
- User authentication with JWT
- Expense CRUD operations
- Category management
- Budget tracking
- Basic analytics
- Receipt uploads
- CSV export
- PDF reports
- Recurring expenses

#### Technical
- React + TypeScript frontend
- Express + TypeScript backend
- SQLite database
- Zustand state management
- Recharts for visualizations
- Tailwind CSS styling
- Winston logging
- Rate limiting
- Security headers

---

## Version History

- **2.0.0** - Phase 3 & 4: Multi-currency, tags, custom fields, advanced analytics, import/export
- **1.0.0** - Initial release with core expense tracking features