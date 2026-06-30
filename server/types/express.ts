import { Request } from 'express';

export interface AuthRequest extends Request {
  userId?: number;
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

export interface ExpenseBody {
  amount: number;
  category_id: number;
  description: string;
  date: string;
  is_recurring?: boolean;
  recurring_frequency?: 'daily' | 'weekly' | 'monthly' | 'yearly';
}

export interface CategoryBody {
  name: string;
  color: string;
  icon?: string;
}

export interface BudgetBody {
  category_id: number;
  amount: number;
  period: 'monthly' | 'yearly';
}

export interface ExpenseQueryParams {
  startDate?: string;
  endDate?: string;
  category?: string;
  search?: string;
}

export interface AnalyticsQueryParams {
  startDate?: string;
  endDate?: string;
}