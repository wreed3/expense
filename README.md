# Expense Tracker

A comprehensive full-stack expense tracking application built with React, TypeScript, Express, and SQLite/PostgreSQL. Track your expenses, manage budgets, analyze spending patterns, and gain insights into your financial habits.

## 🌟 Features

### Core Functionality
- **Expense Management**: Add, edit, delete, and categorize expenses with ease
- **Budget Tracking**: Set monthly budgets per category and monitor spending
- **Multi-Category Support**: Organize expenses across customizable categories
- **Date Range Filtering**: View expenses by custom date ranges
- **Search & Filter**: Quickly find expenses with powerful search capabilities

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
- **Error Handling**: Comprehensive error handling and logging
- **Type Safety**: Full TypeScript implementation
- **Data Validation**: Schema validation using Zod
- **Hot Reload**: Development environment with hot module replacement
- **Automatic Migrations**: Database schema automatically created on first run

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
   
   Edit `.env` with your configuration. **IMPORTANT**: Change the JWT_SECRET to a strong random string:
   ```env
   # Server Configuration
   PORT=3001
   NODE_ENV=development

   # Database Configuration
   DB_TYPE=sqlite
   DB_PATH=./expenses.db

   # JWT Configuration (CHANGE THIS!)
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-minimum-32-chars
   JWT_EXPIRES_IN=7d

   # File Upload
   UPLOAD_DIR=./uploads
   MAX_FILE_SIZE=5242880

   # Client URL
   CLIENT_URL=http://localhost:3000
   ```

   To generate a secure JWT secret:
   ```bash
   openssl rand -base64 64
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

   The database will be automatically created and migrated on first run!

The application will be available at:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **Health Check**: http://localhost:3001/health

## 📁 Project Structure

```
expense/
├── server/                 # Backend Express server
│   ├── index.ts           # Server entry point
│   ├── migrations/        # Database migrations and seeds
│   │   └── init.ts        # Initial schema setup
│   ├── routes/            # API route handlers
│   ├── middleware/        # Express middleware
│   │   ├── auth.ts        # JWT authentication
│   │   └── errorHandler.ts # Centralized error handling
│   └── utils/             # Utility functions
│       ├── db.ts          # Database initialization
│       └── validateEnv.ts # Environment validation
├── src/                   # Frontend React application
│   ├── components/        # React components
│   ├── hooks/            # Custom React hooks
│   ├── stores/           # Zustand state management
│   ├── types/            # TypeScript type definitions
│   └── utils/            # Frontend utilities
│       └── api.ts        # API client with interceptors
├── public/               # Static assets
├── uploads/              # User-uploaded files (auto-created)
├── .env.example          # Environment variables template
├── package.json          # Project dependencies
├── tsconfig.json         # TypeScript configuration
├── tsconfig.server.json  # Server TypeScript config
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

- **JWT_SECRET**: **MUST** be changed to a secure random string in production (minimum 32 characters)
- **JWT_EXPIRES_IN**: Token expiration time (default: 7 days)
- **RATE_LIMIT_MAX_REQUESTS**: Maximum API requests per window (default: 100)
- **RATE_LIMIT_WINDOW_MS**: Rate limit time window in milliseconds (default: 15 minutes)

### File Upload Settings

- **UPLOAD_DIR**: Directory for storing uploaded receipts (auto-created)
- **MAX_FILE_SIZE**: Maximum file size in bytes (default: 5MB)

## 📦 Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start both frontend and backend in development mode |
| `npm run dev:server` | Start only the backend server with hot reload |
| `npm run dev:client` | Start only the frontend development server |
| `npm run build` | Build the application for production |
| `npm run build:server` | Build only the server |
| `npm run preview` | Preview the production build locally |
| `npm run migrate` | Manually run database migrations |
| `npm run seed` | Seed the database with sample data |
| `npm run type-check` | Check TypeScript types without emitting |

## 🔐 Authentication

The application uses JWT (JSON Web Tokens) for authentication:

1. **Register**: Create a new account with email and password
2. **Login**: Authenticate and receive a JWT token
3. **Protected Routes**: Token is automatically included in API requests via interceptors
4. **Token Expiration**: Tokens expire after the configured period (default: 7 days)
5. **Auto-Logout**: Expired tokens automatically trigger logout and redirect to login

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
- **Axios** - HTTP client with interceptors

### Backend
- **Express** - Web framework
- **TypeScript** - Type safety
- **Better-SQLite3** - SQLite database
- **pg** - PostgreSQL client
- **bcrypt** - Password hashing
- **jsonwebtoken** - JWT authentication
- **Zod** - Schema validation
- **Multer** - File uploads
- **Helmet** - Security headers
- **express-rate-limit** - Rate limiting

## 🛡️ Security Features

- **Password Hashing**: Bcrypt with salt rounds
- **JWT Authentication**: Secure token-based auth with expiration
- **Rate Limiting**: Prevent API abuse (100 requests per 15 minutes)
- **Helmet**: Security headers
- **CORS**: Configured cross-origin requests
- **Input Validation**: Zod schema validation on all inputs
- **SQL Injection Prevention**: Parameterized queries
- **File Upload Validation**: Type and size restrictions
- **Token Expiration Handling**: Automatic logout on expired tokens
- **Environment Validation**: Startup checks for required configuration

## 🚀 Deployment

### Production Build

1. **Set production environment variables**
   ```bash
   NODE_ENV=production
   JWT_SECRET=<strong-random-secret-minimum-64-characters>
   DB_TYPE=postgres
   # ... other production settings
   ```

2. **Build the application**
   ```bash
   npm run build
   ```

3. **The database will auto-initialize on first run**
   No need to manually run migrations!

4. **Start the server**
   ```bash
   node dist/server/index.js
   ```

### Environment Considerations

- **Use PostgreSQL for production** (better concurrency than SQLite)
- **Set strong JWT secret** (minimum 64 characters)
- **Configure proper CORS origins**
- **Enable HTTPS**
- **Set up proper logging and monitoring**
- **Configure backup strategy for database**
- **Use environment-specific rate limits**
- **Set MAX_FILE_SIZE appropriately**

## 🐛 Troubleshooting

### Common Issues

**Port already in use**
```bash
# Change PORT in .env file
PORT=3002
```

**Database connection errors**
```bash
# For SQLite: The database will be auto-created
# For PostgreSQL: Verify connection credentials in .env
```

**JWT_SECRET validation error**
```bash
# Ensure JWT_SECRET is at least 32 characters
# Generate a strong secret:
openssl rand -base64 64
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

**Upload directory errors**
```bash
# The upload directory is auto-created
# Ensure the application has write permissions
```

## 📝 Development Guidelines

### Code Style
- Follow TypeScript best practices
- Use ESLint for code quality
- Maintain consistent formatting
- Write descriptive commit messages

### Adding Features
1. Create feature branch from `master`
2. Implement changes with proper error handling
3. Update documentation
4. Test thoroughly
5. Submit pull request

### Database Migrations
- Migrations run automatically on startup
- Schema is created if database doesn't exist
- Always test migrations locally first

## 🔍 What Was Fixed

This update fixed the following issues:

1. ✅ **Database Initialization** - Automatic creation and migration on first run
2. ✅ **Environment Validation** - Comprehensive validation with helpful error messages
3. ✅ **Error Handling** - Centralized error handler with proper status codes
4. ✅ **Authentication** - Improved token expiration handling and auto-logout
5. ✅ **API Client** - Axios interceptors for automatic token injection and error handling
6. ✅ **File Uploads** - Auto-creation of upload directory
7. ✅ **CORS Configuration** - Proper environment-based CORS setup
8. ✅ **TypeScript Configuration** - Separate configs for client and server
9. ✅ **Security** - Enhanced JWT secret validation and rate limiting
10. ✅ **Database Indexes** - Added indexes for better query performance

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
**Last Updated**: 2024