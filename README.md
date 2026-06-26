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
- **Error Handling**: Comprehensive error handling and logging with Winston
- **Type Safety**: Full TypeScript implementation
- **Data Validation**: Schema validation using Zod
- **Hot Reload**: Development environment with hot module replacement
- **Comprehensive Testing**: Unit tests and E2E tests with high coverage

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

## 🧪 Testing

### Running Tests

```bash
# Run all tests (unit + E2E)
npm test

# Run only unit tests
npm run test:unit

# Run only backend tests
npm run test:server

# Run only frontend tests
npm run test:client

# Run tests in watch mode
npm run test:watch

# Run E2E tests
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui

# Run E2E tests in headed mode
npm run test:e2e:headed

# Debug E2E tests
npm run test:e2e:debug
```

### Test Coverage

Test coverage reports are generated in the `coverage/` directory:
- `coverage/server/` - Backend test coverage
- `coverage/client/` - Frontend test coverage

View coverage reports by opening `coverage/server/index.html` or `coverage/client/index.html` in a browser.

### Test Structure

```
expense/
├── server/__tests__/          # Backend unit tests
│   ├── setup.ts              # Test setup and database
│   ├── helpers/              # Test helper functions
│   └── **/*.test.ts          # Test files
├── src/__tests__/            # Frontend unit tests
│   ├── setup.ts              # Test setup
│   ├── helpers/              # Test helper functions
│   ├── __mocks__/            # Mock files
│   └── **/*.test.tsx         # Test files
└── e2e/                      # End-to-end tests
    └── *.spec.ts             # E2E test files
```

## 📁 Project Structure

```
expense/
├── server/                 # Backend Express server
│   ├── index.ts           # Server entry point
│   ├── migrations/        # Database migrations and seeds
│   ├── routes/            # API route handlers
│   ├── middleware/        # Express middleware
│   ├── utils/             # Utility functions
│   └── __tests__/         # Backend unit tests
├── src/                   # Frontend React application
│   ├── components/        # React components
│   ├── hooks/            # Custom React hooks
│   ├── stores/           # Zustand state management
│   ├── types/            # TypeScript type definitions
│   ├── utils/            # Frontend utilities
│   └── __tests__/        # Frontend unit tests
├── e2e/                  # End-to-end tests
├── public/               # Static assets
├── uploads/              # User-uploaded files (receipts)
├── coverage/             # Test coverage reports
├── .env.example          # Environment variables template
├── .env.test             # Test environment variables
├── jest.config.server.cjs # Backend Jest configuration
├── jest.config.client.cjs # Frontend Jest configuration
├── playwright.config.ts   # Playwright E2E configuration
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
| `npm test` | Run all tests (unit + E2E) |
| `npm run test:unit` | Run all unit tests |
| `npm run test:server` | Run backend unit tests |
| `npm run test:client` | Run frontend unit tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:e2e` | Run E2E tests |
| `npm run test:e2e:ui` | Run E2E tests with UI |

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

### Testing
- **Jest** - Unit testing framework
- **React Testing Library** - React component testing
- **Supertest** - API testing
- **Playwright** - E2E testing
- **ts-jest** - TypeScript support for Jest

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

### Testing Guidelines
- Write tests for all new features
- Maintain test coverage above 80%
- Test edge cases and error conditions
- Use descriptive test names
- Mock external dependencies

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

**Test failures**
```bash
# Clear test database
rm -f test-expenses.db

# Run tests with verbose output
npm run test:server -- --verbose
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