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

export interface SpendingSummary {
  total: number;
  by_category: Array<{
    category_id: number;
    category_name: string;
    category_color: string;
    total: number;
    count: number;
  }>;
  by_month: Array<{
    month: string;
    total: number;
    count: number;
  }>;
  by_tag?: Array<{
    tag_id: number;
    tag_name: string;
    total: number;
    count: number;
  }>;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

export interface ExpenseState {
  expenses: Expense[];
  filters: ExpenseFilters;
  pagination: PaginatedExpenses['pagination'] | null;
  isLoading: boolean;
  error: string | null;
  fetchExpenses: (filters?: ExpenseFilters) => Promise<void>;
  addExpense: (expense: Partial<Expense>, receipt?: File) => Promise<void>;
  updateExpense: (id: number, expense: Partial<Expense>, receipt?: File) => Promise<void>;
  deleteExpense: (id: number) => Promise<void>;
  bulkDelete: (ids: number[]) => Promise<void>;
  bulkTag: (expenseIds: number[], tagIds: number[]) => Promise<void>;
  setFilters: (filters: ExpenseFilters) => void;
  clearFilters: () => void;
}

export interface CategoryState {
  categories: Category[];
  isLoading: boolean;
  error: string | null;
  fetchCategories: () => Promise<void>;
  addCategory: (category: Partial<Category>) => Promise<void>;
  updateCategory: (id: number, category: Partial<Category>) => Promise<void>;
  deleteCategory: (id: number) => Promise<void>;
}

export interface BudgetState {
  budgets: Budget[];
  isLoading: boolean;
  error: string | null;
  fetchBudgets: () => Promise<void>;
  addBudget: (budget: Partial<Budget>) => Promise<void>;
  updateBudget: (id: number, budget: Partial<Budget>) => Promise<void>;
  deleteBudget: (id: number) => Promise<void>;
}

export interface CurrencyState {
  currencies: Currency[];
  defaultCurrency: Currency | null;
  isLoading: boolean;
  error: string | null;
  fetchCurrencies: () => Promise<void>;
  updateExchangeRate: (code: string, rate: number) => Promise<void>;
  setDefaultCurrency: (code: string) => Promise<void>;
  convertAmount: (amount: number, from: string, to: string) => Promise<number>;
}

export interface TagState {
  tags: Tag[];
  isLoading: boolean;
  error: string | null;
  fetchTags: () => Promise<void>;
  addTag: (tag: Partial<Tag>) => Promise<void>;
  updateTag: (id: number, tag: Partial<Tag>) => Promise<void>;
  deleteTag: (id: number) => Promise<void>;
}

export interface CustomFieldState {
  customFields: CustomField[];
  isLoading: boolean;
  error: string | null;
  fetchCustomFields: () => Promise<void>;
  addCustomField: (field: Partial<CustomField>) => Promise<void>;
  updateCustomField: (id: number, field: Partial<CustomField>) => Promise<void>;
  deleteCustomField: (id: number) => Promise<void>;
}