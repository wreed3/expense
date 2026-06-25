# Expense Tracker

A comprehensive full-stack expense tracking application built with React, TypeScript, Express, and SQLite/PostgreSQL. Track your expenses, manage budgets, analyze spending patterns, and gain insights into your financial habits.

## 🌟 Features

### Core Functionality
- **Expense Management**: Add, edit, delete, and categorize expenses with ease
- **Budget Tracking**: Set monthly budgets per category and monitor spending
- **Multi-Category Support**: Organize expenses across customizable categories
- **Date Range Filtering**: View expenses by custom date ranges
- **Search & Filter**: Quickly find expenses with powerful search capabilities

### Phase 3 Features (NEW! 🎉)
- **Multi-Currency Support**: Track expenses in 9 major currencies with automatic conversion
- **Tags System**: Organize expenses with color-coded tags and bulk tagging
- **Custom Fields**: Add metadata to expenses with 5 field types (text, number, date, boolean, select)
- **Advanced Search**: Filter by date range, amount, category, tags, currency, and more
- **Bulk Operations**: Delete or tag multiple expenses at once
- **Enhanced UI**: Improved expense list with pagination and visual indicators

### Advanced Features
- **User Authentication**: Secure JWT-based authentication system
- **Data Visualization**: Interactive charts and graphs using Recharts
- **Receipt Management**: Upload and attach receipts to expenses
- **Export Capabilities**: Export data to CSV and generate PDF reports
- **Recurring Expenses**: Set up automatic recurring transactions
- **Budget Alerts**: Get notified when approaching budget limits
- **Spending Analytics**: Detailed insights and trend analysis
- **Responsive Design**: Works seamlessly on desktop and mobile devices

### Technical Features
- **Database Flexibility**: Support for both SQLite and PostgreSQL
- **Rate Limiting**: Built-in API rate limiting for security
- **Error Handling**: Comprehensive error handling and logging with Winston
- **Type Safety**: Full TypeScript implementation
- **Data Validation**: Schema validation using Zod
- **Hot Reload**: Development environment with hot module replacement

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- SQLite (default) or PostgreSQL (optional)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/wreed3/expense.git
   cd expense
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your configuration:
   ```env
   # Server Configuration
   PORT=3001
   NODE_ENV=development

   # Database Configuration
   DB_TYPE=sqlite
   DB_PATH=./expenses.db

   # JWT Configuration
   JWT_SECRET=your-secret-key-change-this-in-production
   JWT_EXPIRES_IN=7d

   # File Upload
   UPLOAD_DIR=./uploads
   MAX_FILE_SIZE=5242880

   # Client URL
   CLIENT_URL=http://localhost:3000
   ```

4. **Run database migrations**
   ```bash
   npm run migrate
   ```

5. **Seed initial data (optional)**
   ```bash
   npm run seed
   ```

6. **Start the development server**
   ```bash
   npm run dev
   ```

The application will be available at:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001

## 📁 Project Structure

```
expense/
├── server/                 # Backend Express server
│   ├── index.ts           # Server entry point
│   ├── migrations/        # Database migrations and seeds
│   │   ├── 001_initial_schema.ts
│   │   ├── 002_add_recurring_expenses.ts
│   │   ├── 003_add_budgets.ts
│   │   ├── 004_phase3_features.ts    # NEW: Phase 3 features
│   │   └── index.ts       # Migration runner
│   ├── routes/            # API route handlers
│   │   ├── auth.ts
│   │   ├── expenses.ts
│   │   ├── categories.ts
│   │   ├── budgets.ts
│   │   ├── analytics.ts
│   │   ├── export.ts
│   │   ├── currencies.ts  # NEW: Currency management
│   │   ├── tags.ts        # NEW: Tag management
│   │   └── custom-fields.ts  # NEW: Custom fields
│   ├── middleware/        # Express middleware
│   └── utils/             # Utility functions
├── src/                   # Frontend React application
│   ├── components/        # React components
│   │   ├── CurrencySelector.tsx       # NEW
│   │   ├── CurrencySettings.tsx       # NEW
│   │   ├── TagManager.tsx             # NEW
│   │   ├── TagSelector.tsx            # NEW
│   │   ├── CustomFieldManager.tsx     # NEW
│   │   ├── CustomFieldInput.tsx       # NEW
│   │   ├── AdvancedSearch.tsx         # NEW
│   │   └── Settings.tsx               # NEW
│   ├── hooks/            # Custom React hooks
│   ├── stores/           # Zustand state management
│   │   ├── currencyStore.ts   # NEW
│   │   ├── tagStore.ts        # NEW
│   │   └── customFieldStore.ts  # NEW
│   ├── types/            # TypeScript type definitions
│   └── utils/            # Frontend utilities
├── public/               # Static assets
├── uploads/              # User-uploaded files (receipts)
├── .env.example          # Environment variables template
├── package.json          # Project dependencies
├── PHASE3_FEATURES.md    # NEW: Phase 3 documentation
├── tsconfig.json         # TypeScript configuration
└── vite.config.ts        # Vite build configuration
```

## 🔧 Configuration

### Database Options

#### SQLite (Default)
```env
DB_TYPE=sqlite
DB_PATH=./expenses.db
```

#### PostgreSQL
```env
DB_TYPE=postgres
DB_HOST=localhost
DB_PORT=5432
DB_NAME=expense_tracker
DB_USER=postgres
DB_PASSWORD=your_password
```

### Security Settings

- **JWT_SECRET**: Change this to a secure random string in production
- **JWT_EXPIRES_IN**: Token expiration time (default: 7 days)
- **RATE_LIMIT_MAX_REQUESTS**: Maximum API requests per window (default: 100)
- **RATE_LIMIT_WINDOW_MS**: Rate limit time window in milliseconds (default: 15 minutes)

### File Upload Settings

- **UPLOAD_DIR**: Directory for storing uploaded receipts
- **MAX_FILE_SIZE**: Maximum file size in bytes (default: 5MB)

## 📦 Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start both frontend and backend in development mode |
| `npm run dev:server` | Start only the backend server with hot reload |
| `npm run dev:client` | Start only the frontend development server |
| `npm run build` | Build the application for production |
| `npm run preview` | Preview the production build locally |
| `npm run migrate` | Run database migrations |
| `npm run migrate:down` | Rollback last migration |
| `npm run seed` | Seed the database with sample data |

## 🆕 Phase 3 Features

### Multi-Currency Support
Track expenses in multiple currencies with automatic conversion:
- Support for USD, EUR, GBP, JPY, CAD, AUD, CHF, CNY, INR
- Configurable exchange rates
- Set your preferred default currency
- View amounts in original or converted currency

### Tags System
Organize expenses with custom tags:
- Create unlimited tags with custom colors
- Tag multiple expenses at once (bulk tagging)
- Filter expenses by tags
- See tag usage statistics

### Custom Fields
Add custom metadata to expenses:
- 5 field types: text, number, date, boolean, select
- Mark fields as required or optional
- Create dropdown options for select fields
- Examples: Project name, Client, Payment method, Reimbursable status

### Advanced Search
Powerful filtering capabilities:
- Search by description text
- Filter by date range and amount range
- Filter by category, currency, and tags
- Sort by multiple criteria
- Pagination support

### Bulk Operations
Manage multiple expenses efficiently:
- Bulk delete expenses
- Bulk tag expenses
- Select all or individual expenses

For detailed documentation, see [PHASE3_FEATURES.md](./PHASE3_FEATURES.md)

## 🔐 Authentication

The application uses JWT (JSON Web Tokens) for authentication:

1. **Register**: Create a new account with email and password
2. **Login**: Authenticate and receive a JWT token
3. **Protected Routes**: Token is automatically included in API requests
4. **Token Expiration**: Tokens expire after the configured period (default: 7 days)

## 📊 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Expenses
- `GET /api/expenses` - Get all expenses (with advanced filters)
- `POST /api/expenses` - Create new expense
- `GET /api/expenses/:id` - Get expense by ID
- `PUT /api/expenses/:id` - Update expense
- `DELETE /api/expenses/:id` - Delete expense
- `POST /api/expenses/bulk/delete` - Bulk delete expenses
- `POST /api/expenses/bulk/tag` - Bulk tag expenses

### Categories
- `GET /api/categories` - Get all categories
- `POST /api/categories` - Create new category
- `PUT /api/categories/:id` - Update category
- `DELETE /api/categories/:id` - Delete category

### Budgets
- `GET /api/budgets` - Get all budgets
- `POST /api/budgets` - Create new budget
- `PUT /api/budgets/:id` - Update budget
- `DELETE /api/budgets/:id` - Delete budget

### Currencies (NEW)
- `GET /api/currencies` - Get all currencies
- `GET /api/currencies/default` - Get default currency
- `PUT /api/currencies/:code` - Update exchange rate
- `POST /api/currencies/:code/set-default` - Set default currency
- `POST /api/currencies/convert` - Convert between currencies

### Tags (NEW)
- `GET /api/tags` - Get all tags
- `POST /api/tags` - Create new tag
- `PUT /api/tags/:id` - Update tag
- `DELETE /api/tags/:id` - Delete tag
- `GET /api/tags/:id/expenses` - Get expenses with tag

### Custom Fields (NEW)
- `GET /api/custom-fields` - Get all custom fields
- `POST /api/custom-fields` - Create new custom field
- `PUT /api/custom-fields/:id` - Update custom field
- `DELETE /api/custom-fields/:id` - Delete custom field

### Analytics
- `GET /api/analytics/summary` - Get spending summary
- `GET /api/analytics/trends` - Get spending trends
- `GET /api/analytics/categories` - Get category breakdown

### Export
- `GET /api/export/csv` - Export expenses to CSV
- `GET /api/export/pdf` - Generate PDF report

## 🎨 Technology Stack

### Frontend
- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Zustand** - State management
- **Recharts** - Data visualization
- **React Hot Toast** - Notifications
- **date-fns** - Date manipulation
- **jsPDF** - PDF generation

### Backend
- **Express** - Web framework
- **TypeScript** - Type safety
- **Better-SQLite3** - SQLite database
- **pg** - PostgreSQL client
- **bcrypt** - Password hashing
- **jsonwebtoken** - JWT authentication
- **Zod** - Schema validation
- **Multer** - File uploads
- **Winston** - Logging
- **Helmet** - Security headers
- **express-rate-limit** - Rate limiting

## 🛡️ Security Features

- **Password Hashing**: Bcrypt with salt rounds
- **JWT Authentication**: Secure token-based auth
- **Rate Limiting**: Prevent API abuse
- **Helmet**: Security headers
- **CORS**: Configured cross-origin requests
- **Input Validation**: Zod schema validation
- **SQL Injection Prevention**: Parameterized queries
- **File Upload Validation**: Type and size restrictions

## 🚀 Deployment

### Production Build

1. **Set production environment variables**
   ```bash
   NODE_ENV=production
   JWT_SECRET=<strong-random-secret>
   ```

2. **Build the application**
   ```bash
   npm run build
   ```

3. **Run migrations**
   ```bash
   npm run migrate
   ```

4. **Start the server**
   ```bash
   node dist/server/index.js
   ```

### Environment Considerations

- Use PostgreSQL for production (better concurrency than SQLite)
- Set strong JWT secret
- Configure proper CORS origins
- Enable HTTPS
- Set up proper logging and monitoring
- Configure backup strategy for database
- Use environment-specific rate limits

## 📝 Development Guidelines

### Code Style
- Follow TypeScript best practices
- Use ESLint for code quality
- Maintain consistent formatting
- Write descriptive commit messages

### Adding Features
1. Create feature branch from `master`
2. Implement changes with tests
3. Update documentation
4. Submit pull request

### Database Migrations
- Always create migrations for schema changes
- Test migrations on development database first
- Keep migrations reversible when possible

## 🐛 Troubleshooting

### Common Issues

**Port already in use**
```bash
# Change PORT in .env file
PORT=3002
```

**Database connection errors**
```bash
# Verify database configuration in .env
# For SQLite, ensure DB_PATH directory exists
# For PostgreSQL, verify connection credentials
```

**Module not found errors**
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

**Build errors**
```bash
# Clear build cache
rm -rf dist .vite
npm run build
```

**Migration errors**
```bash
# Check migration status
npm run migrate

# Rollback if needed
npm run migrate:down
```

## 📄 License

This project is available for use under the MIT License.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit issues and pull requests.

## 📧 Support

For questions or support, please open an issue on the GitHub repository.

---

**Version**: 2.0.0  
**Repository**: [wreed3/expense](https://github.com/wreed3/expense)  
**Branch**: master

## 🎉 What's New in Version 2.0

- ✅ Multi-currency support with 9 major currencies
- ✅ Tag system for flexible expense organization
- ✅ Custom fields for additional metadata
- ✅ Advanced search and filtering
- ✅ Bulk operations for efficiency
- ✅ Enhanced UI with better visual indicators
- ✅ Improved performance with database indexes
- ✅ Comprehensive settings management