# Expense Tracker

A comprehensive full-stack expense tracking application built with React, TypeScript, Express, and SQLite/PostgreSQL. Track your expenses, manage budgets, analyze spending patterns, and gain insights into your financial habits.

## 🌟 Features

### Core Functionality
- **Expense Management**: Add, edit, delete, and categorize expenses with ease
- **Budget Tracking**: Set monthly budgets per category and monitor spending
- **Multi-Category Support**: Organize expenses across customizable categories
- **Date Range Filtering**: View expenses by custom date ranges
- **Search & Filter**: Quickly find expenses with powerful search capabilities

### Phase 3 Features
- **Multi-Currency Support**: Track expenses in 9 major currencies with automatic conversion
- **Tags System**: Organize expenses with color-coded tags and bulk tagging
- **Custom Fields**: Add metadata to expenses with 5 field types (text, number, date, boolean, select)
- **Advanced Search**: Filter by date range, amount, category, tags, currency, and more
- **Bulk Operations**: Delete or tag multiple expenses at once

### Phase 4 Features (NEW! 🎉)
- **Advanced Analytics**: Spending trends, forecasting, category comparison, and budget performance
- **Smart Insights**: AI-powered recommendations and spending pattern detection
- **Spending Heatmap**: Visual calendar showing daily spending intensity
- **Month-over-Month Comparison**: Track changes in spending habits
- **Data Import**: Import expenses from CSV/Excel files with validation
- **Excel Export**: Export expenses with professional formatting
- **Full Backup/Restore**: Complete data backup and restore functionality
- **Mobile Optimized**: Responsive design with mobile-first approach
- **Grid/List Views**: Toggle between different viewing modes

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
- **Caching**: Optional Redis caching for improved performance
- **Testing**: Comprehensive test suite with Vitest and Playwright

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- SQLite (default) or PostgreSQL (optional)
- Redis (optional, for caching)

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

   # Redis Configuration (Optional)
   REDIS_ENABLED=false
   REDIS_HOST=localhost
   REDIS_PORT=6379
   REDIS_PASSWORD=
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
│   │   ├── run.ts         # Migration runner
│   │   ├── seed.ts        # Seed data
│   │   └── 004_phase3_features.ts  # Phase 3 schema
│   ├── routes/            # API route handlers
│   │   ├── analytics-advanced.ts  # Advanced analytics endpoints
│   │   ├── import-export.ts       # Import/export functionality
│   │   ├── currencies.ts          # Currency management
│   │   ├── tags.ts               # Tag management
│   │   ├── custom-fields.ts      # Custom field management
│   │   └── ...
│   ├── middleware/        # Express middleware
│   └── utils/             # Utility functions
│       └── cache.ts       # Redis caching utilities
├── src/                   # Frontend React application
│   ├── components/        # React components
│   │   ├── AdvancedAnalytics.tsx
│   │   ├── ImportExport.tsx
│   │   ├── CurrencySettings.tsx
│   │   ├── TagManager.tsx
│   │   ├── CustomFieldManager.tsx
│   │   └── ...
│   ├── hooks/            # Custom React hooks
│   ├── stores/           # Zustand state management
│   │   ├── currencyStore.ts
│   │   ├── tagStore.ts
│   │   ├── customFieldStore.ts
│   │   ├── analyticsStore.ts
│   │   ├── importExportStore.ts
│   │   └── ...
│   ├── types/            # TypeScript type definitions
│   └── utils/            # Frontend utilities
├── public/               # Static assets
├── uploads/              # User-uploaded files (receipts)
├── .env.example          # Environment variables template
├── package.json          # Project dependencies
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

### Redis Caching (Optional)

- **REDIS_ENABLED**: Enable/disable Redis caching
- **REDIS_HOST**: Redis server host
- **REDIS_PORT**: Redis server port
- **REDIS_PASSWORD**: Redis password (if required)

## 📦 Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start both frontend and backend in development mode |
| `npm run dev:server` | Start only the backend server with hot reload |
| `npm run dev:client` | Start only the frontend development server |
| `npm run build` | Build the application for production |
| `npm run preview` | Preview the production build locally |
| `npm run migrate` | Run database migrations |
| `npm run seed` | Seed the database with sample data |
| `npm test` | Run unit tests |
| `npm run test:ui` | Run tests with UI |
| `npm run test:coverage` | Run tests with coverage report |
| `npm run test:e2e` | Run end-to-end tests |

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
- `GET /api/expenses` - Get all expenses (with filters)
- `POST /api/expenses` - Create new expense
- `GET /api/expenses/:id` - Get expense by ID
- `PUT /api/expenses/:id` - Update expense
- `DELETE /api/expenses/:id` - Delete expense

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

### Currencies (Phase 3)
- `GET /api/currencies` - Get all currencies
- `PUT /api/currencies/:code` - Update exchange rate
- `POST /api/currencies/:code/set-default` - Set default currency
- `POST /api/currencies/convert` - Convert between currencies

### Tags (Phase 3)
- `GET /api/tags` - Get all tags
- `POST /api/tags` - Create new tag
- `PUT /api/tags/:id` - Update tag
- `DELETE /api/tags/:id` - Delete tag

### Custom Fields (Phase 3)
- `GET /api/custom-fields` - Get all custom fields
- `POST /api/custom-fields` - Create new field
- `PUT /api/custom-fields/:id` - Update field
- `DELETE /api/custom-fields/:id` - Delete field

### Advanced Analytics (Phase 4)
- `GET /api/analytics-advanced/trends` - Spending trends with forecast
- `GET /api/analytics-advanced/category-comparison` - Category analysis
- `GET /api/analytics-advanced/budget-performance` - Budget metrics
- `GET /api/analytics-advanced/heatmap` - Daily spending heatmap
- `GET /api/analytics-advanced/top-expenses` - Highest expenses
- `GET /api/analytics-advanced/month-comparison` - Monthly comparison
- `GET /api/analytics-advanced/insights` - Smart insights

### Import/Export (Phase 4)
- `POST /api/import-export/import` - Import expenses from CSV/Excel
- `GET /api/import-export/export/excel` - Export to Excel
- `GET /api/import-export/backup` - Create full backup
- `POST /api/import-export/restore` - Restore from backup
- `GET /api/import-export/template` - Download import template

## 🎨 Technology Stack

### Frontend
- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Zustand** - State management
- **Recharts** - Data visualization
- **React Hot Toast** - Notifications
- **date-fns** - Date manipulation
- **Tailwind CSS** - Styling

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
- **xlsx** - Excel file handling
- **csv-parse** - CSV parsing
- **ioredis** - Redis client (optional)

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
- Enable Redis caching for better performance

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