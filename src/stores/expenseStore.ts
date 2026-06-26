import { create } from 'zustand';

interface Category {
  id: number;
  name: string;
  color: string;
  icon?: string;
}

interface Expense {
  id: number;
  user_id: number;
  category_id: number;
  amount: number;
  description: string;
  date: string;
  receipt_path?: string;
  is_recurring: boolean;
  recurring_frequency?: string;
  created_at: string;
  updated_at: string;
  category: Category;
}

interface ExpenseFilters {
  categoryId?: number;
  startDate?: string;
  endDate?: string;
  search?: string;
}

interface ExpenseState {
  expenses: Expense[];
  isLoading: boolean;
  error: string | null;
  fetchExpenses: (filters?: ExpenseFilters) => Promise<void>;
  addExpense: (expense: Partial<Expense>) => Promise<void>;
  updateExpense: (id: number, expense: Partial<Expense>) => Promise<void>;
  deleteExpense: (id: number) => Promise<void>;
}

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
};

export const useExpenseStore = create<ExpenseState>((set, get) => ({
  expenses: [],
  isLoading: false,
  error: null,

  fetchExpenses: async (filters = {}) => {
    set({ isLoading: true, error: null });
    try {
      const params = new URLSearchParams();
      if (filters.categoryId) params.append('categoryId', filters.categoryId.toString());
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.search) params.append('search', filters.search);

      const response = await fetch(
        `http://localhost:3001/api/expenses?${params.toString()}`,
        { headers: getAuthHeaders() }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch expenses');
      }

      set({ expenses: data.expenses, isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch expenses',
        isLoading: false 
      });
    }
  },

  addExpense: async (expense) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch('http://localhost:3001/api/expenses', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(expense),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add expense');
      }

      set(state => ({
        expenses: [...state.expenses, data.expense],
        isLoading: false,
      }));
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to add expense',
        isLoading: false 
      });
      throw error;
    }
  },

  updateExpense: async (id, expense) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`http://localhost:3001/api/expenses/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(expense),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update expense');
      }

      set(state => ({
        expenses: state.expenses.map(e => e.id === id ? data.expense : e),
        isLoading: false,
      }));
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to update expense',
        isLoading: false 
      });
      throw error;
    }
  },

  deleteExpense: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`http://localhost:3001/api/expenses/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete expense');
      }

      set(state => ({
        expenses: state.expenses.filter(e => e.id !== id),
        isLoading: false,
      }));
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to delete expense',
        isLoading: false 
      });
      throw error;
    }
  },
}));