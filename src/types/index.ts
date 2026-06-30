export interface User {
  id: number;
  email: string;
  name: string;
  created_at: string;
}

export interface Category {
  id: number;
  user_id: number;
  name: string;
  color: string;
  icon: string | null;
  created_at: string;
}

export interface Expense {
  id: number;
  user_id: number;
  amount: number;
  category_id: number;
  description: string;
  date: string;
  receipt_path: string | null;
  is_recurring: number;
  recurring_frequency: 'daily' | 'weekly' | 'monthly' | 'yearly' | null;
  created_at: string;
  category_name?: string;
  category_color?: string;
  category_icon?: string;
}

export interface Budget {
  id: number;
  user_id: number;
  category_id: number;
  amount: number;
  period: 'monthly' | 'yearly';
  created_at: string;
  category_name?: string;
  category_color?: string;
  spent?: number;
}

export interface AuthResponse {
  token: string;
  user: {
    id: number;
    email: string;
    name: string;
  };
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  name: string;
}

export interface ExpenseFormData {
  amount: number;
  category_id: number;
  description: string;
  date: string;
  is_recurring?: boolean;
  recurring_frequency?: 'daily' | 'weekly' | 'monthly' | 'yearly';
}

export interface CategoryFormData {
  name: string;
  color: string;
  icon?: string;
}

export interface BudgetFormData {
  category_id: number;
  amount: number;
  period: 'monthly' | 'yearly';
}

export interface ExpenseFilters {
  startDate?: string;
  endDate?: string;
  category?: string;
  search?: string;
}

export interface AnalyticsSummary {
  total: number;
  count: number;
  average: number;
  categories: CategorySpending[];
}

export interface CategorySpending {
  category_id: number;
  category_name: string;
  category_color: string;
  total: number;
  count: number;
}

export interface TrendData {
  period: string;
  total: number;
}

export interface CategoryAnalytics {
  id: number;
  name: string;
  color: string;
  icon: string | null;
  expense_count: number;
  total_spent: number;
  average_expense: number;
}

export interface ApiError {
  error: string;
  details?: unknown;
}