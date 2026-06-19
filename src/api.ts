const API_BASE = '/api';

export interface Expense {
  id: number;
  description: string;
  amount: number;
  category_id: number;
  date: string;
  created_at: string;
  category_name: string;
  category_color: string;
  category_icon: string;
}

export interface Category {
  id: number;
  name: string;
  color: string;
  icon: string;
}

export interface ExpenseStats {
  byCategory: Array<{
    category_id: number;
    name: string;
    color: string;
    icon: string;
    total: number;
  }>;
  total: number;
}

interface ExpenseFilters {
  startDate?: string;
  endDate?: string;
  categoryId?: string;
}

export const api = {
  async getExpenses(filters: ExpenseFilters = {}): Promise<Expense[]> {
    const params = new URLSearchParams();
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.categoryId) params.append('categoryId', filters.categoryId);

    const response = await fetch(`${API_BASE}/expenses?${params}`);
    if (!response.ok) throw new Error('Failed to fetch expenses');
    return response.json();
  },

  async createExpense(expense: Omit<Expense, 'id' | 'created_at' | 'category_name' | 'category_color' | 'category_icon'>): Promise<Expense> {
    const response = await fetch(`${API_BASE}/expenses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(expense),
    });
    if (!response.ok) throw new Error('Failed to create expense');
    return response.json();
  },

  async updateExpense(id: number, expense: Omit<Expense, 'created_at' | 'category_name' | 'category_color' | 'category_icon'>): Promise<Expense> {
    const response = await fetch(`${API_BASE}/expenses/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(expense),
    });
    if (!response.ok) throw new Error('Failed to update expense');
    return response.json();
  },

  async deleteExpense(id: number): Promise<void> {
    const response = await fetch(`${API_BASE}/expenses/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete expense');
  },

  async getCategories(): Promise<Category[]> {
    const response = await fetch(`${API_BASE}/categories`);
    if (!response.ok) throw new Error('Failed to fetch categories');
    return response.json();
  },

  async getStats(filters: ExpenseFilters = {}): Promise<ExpenseStats> {
    const params = new URLSearchParams();
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);

    const response = await fetch(`${API_BASE}/expenses/stats/summary?${params}`);
    if (!response.ok) throw new Error('Failed to fetch stats');
    return response.json();
  },
};