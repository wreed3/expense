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
  icon?: string;
  created_at: string;
}

export interface Currency {
  id: number;
  code: string;
  name: string;
  symbol: string;
  exchange_rate: number;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface Tag {
  id: number;
  user_id: number;
  name: string;
  color?: string;
  created_at: string;
  usage_count?: number;
}

export interface CustomField {
  id: number;
  user_id: number;
  name: string;
  field_type: 'text' | 'number' | 'date' | 'boolean' | 'select';
  options?: string[];
  is_required: boolean;
  created_at: string;
}

export interface Expense {
  id: number;
  user_id: number;
  amount: number;
  category_id: number;
  category_name?: string;
  category_color?: string;
  description: string;
  date: string;
  receipt_path?: string;
  is_recurring: boolean;
  recurring_frequency?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  currency_code: string;
  original_amount?: number;
  tags?: Tag[];
  custom_fields?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface Budget {
  id: number;
  user_id: number;
  category_id: number;
  category_name?: string;
  category_color?: string;
  amount: number;
  period: 'monthly' | 'yearly';
  start_date: string;
  end_date?: string;
  spent?: number;
  remaining?: number;
  percentage?: number;
  created_at: string;
}

export interface ExpenseFilters {
  start_date?: string;
  end_date?: string;
  category_id?: number;
  min_amount?: number;
  max_amount?: number;
  search?: string;
  tags?: number[];
  currency?: string;
  sort_by?: 'date' | 'amount' | 'description' | 'category_name';
  sort_order?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface PaginatedExpenses {
  expenses: Expense[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    has_more: boolean;
  };
}