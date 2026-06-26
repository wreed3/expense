import { create } from 'zustand';

interface Category {
  id: number;
  name: string;
  color: string;
  icon?: string;
}

interface Budget {
  id: number;
  user_id: number;
  category_id: number;
  amount: number;
  month: string;
  alert_threshold: number;
  spent: number;
  remaining: number;
  percentage: number;
  created_at: string;
  updated_at: string;
  category: Category;
}

interface BudgetState {
  budgets: Budget[];
  isLoading: boolean;
  error: string | null;
  fetchBudgets: (month?: string) => Promise<void>;
  addBudget: (budget: Partial<Budget>) => Promise<void>;
  updateBudget: (id: number, budget: Partial<Budget>) => Promise<void>;
  deleteBudget: (id: number) => Promise<void>;
}

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
};

export const useBudgetStore = create<BudgetState>((set) => ({
  budgets: [],
  isLoading: false,
  error: null,

  fetchBudgets: async (month) => {
    set({ isLoading: true, error: null });
    try {
      const params = month ? `?month=${month}` : '';
      const response = await fetch(`http://localhost:3001/api/budgets${params}`, {
        headers: getAuthHeaders(),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch budgets');
      }

      set({ budgets: data.budgets, isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch budgets',
        isLoading: false 
      });
    }
  },

  addBudget: async (budget) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch('http://localhost:3001/api/budgets', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(budget),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add budget');
      }

      set(state => ({
        budgets: [...state.budgets, data.budget],
        isLoading: false,
      }));
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to add budget',
        isLoading: false 
      });
      throw error;
    }
  },

  updateBudget: async (id, budget) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`http://localhost:3001/api/budgets/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(budget),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update budget');
      }

      set(state => ({
        budgets: state.budgets.map(b => b.id === id ? data.budget : b),
        isLoading: false,
      }));
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to update budget',
        isLoading: false 
      });
      throw error;
    }
  },

  deleteBudget: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`http://localhost:3001/api/budgets/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete budget');
      }

      set(state => ({
        budgets: state.budgets.filter(b => b.id !== id),
        isLoading: false,
      }));
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to delete budget',
        isLoading: false 
      });
      throw error;
    }
  },
}));