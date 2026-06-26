import { Request } from 'express';

// Database Models
export interface User {
  id: number;
  email: string;
  password: string;
  name: string;
  created_at: string;
}

export interface Expense {
  id: number;
  user_id: number;
  amount: number;
  description: string;
  category_id: number;
  date: string;
  receipt_path: string | null;
  is_recurring: boolean;
  recurring_frequency: string | null;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: number;
  user_id: number;
  name: string;
  color: string;
  icon: string;
  created_at: string;
}

export interface Budget {
  id: number;
  user_id: number;
  category_id: number;
  amount: number;
  month: string;
  created_at: string;
  updated_at: string;
}

// API Request/Response Types
export interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
    name: string;
  };
}

export interface RegisterBody {
  email: string;
  password: string;
  name: string;
}

export interface LoginBody {
  email: string;
  password: string;
}

export interface CreateExpenseBody {
  amount: number;
  description: string;
  category_id: number;
  date: string;
  is_recurring?: boolean;
  recurring_frequency?: string;
}

export interface UpdateExpenseBody extends Partial<CreateExpenseBody> {}

export interface CreateCategoryBody {
  name: string;
  color: string;
  icon: string;
}

export interface UpdateCategoryBody extends Partial<CreateCategoryBody> {}

export interface CreateBudgetBody {
  category_id: number;
  amount: number;
  month: string;
}

export interface UpdateBudgetBody extends Partial<CreateBudgetBody> {}

// Query Parameters
export interface ExpenseQueryParams {
  category_id?: string;
  start_date?: string;
  end_date?: string;
  search?: string;
}

export interface AnalyticsQueryParams {
  start_date?: string;
  end_date?: string;
}

// JWT Payload
export interface JwtPayload {
  userId: number;
  email: string;
}

// Database Query Results
export interface ExpenseWithCategory extends Expense {
  category_name: string;
  category_color: string;
  category_icon: string;
}

export interface BudgetWithCategory extends Budget {
  category_name: string;
  spent: number;
}

export interface CategorySpending {
  category_id: number;
  category_name: string;
  category_color: string;
  total_spent: number;
}

export interface MonthlySpending {
  month: string;
  total: number;
}

export interface SpendingSummary {
  total_expenses: number;
  total_spent: number;
  category_breakdown: CategorySpending[];
  monthly_trend: MonthlySpending[];
}

// Environment Variables
export interface EnvConfig {
  PORT: number;
  NODE_ENV: string;
  DB_TYPE: 'sqlite' | 'postgres';
  DB_PATH?: string;
  DB_HOST?: string;
  DB_PORT?: number;
  DB_NAME?: string;
  DB_USER?: string;
  DB_PASSWORD?: string;
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  UPLOAD_DIR: string;
  MAX_FILE_SIZE: number;
  CLIENT_URL: string;
  RATE_LIMIT_MAX_REQUESTS: number;
  RATE_LIMIT_WINDOW_MS: number;
}

// Error Types
export interface ApiError {
  message: string;
  statusCode: number;
  errors?: Record<string, string[]>;
}