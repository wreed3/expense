import { create } from 'zustand';
import type { Expense } from '../types';

interface ExpenseFilters {
  startDate?: string;
  endDate?: string;
  categoryId?: number;
  search?: string;
  minAmount?: number;
  maxAmount?: number;
}

interface ExpenseState {
  expenses: Expense[];
  filters: ExpenseFilters;
  isLoading: boolean;
  error: string | null;
  fetchExpenses: (filters?: ExpenseFilters) => Promise<void>;
  setFilters: (filters: ExpenseFilters) => void;
  createExpense: (expense: Omit<Expense, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateExpense: (id: number, expense: Partial<Omit<Expense, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>) => Promise<void>;
  deleteExpense: (id: number) => Promise<void>;
}

export const useExpenseStore = create<ExpenseState>((set, get) => ({
  expenses: [],
  filters: {},
  isLoading: false,
  error: null,

  setFilters: (filters) => {
    set({ filters });
    get().fetchExpenses(filters);
  },

  fetchExpenses: async (filters) => {
    set({ isLoading: true, error: null });
    try {
      const params = new URLSearchParams();
      const activeFilters = filters || get().filters;
      
      if (activeFilters.startDate) params.append('startDate', activeFilters.startDate);
      if (activeFilters.endDate) params.append('endDate', activeFilters.endDate);
      if (activeFilters.categoryId) params.append('categoryId', activeFilters.categoryId.toString());
      if (activeFilters.search) params.append('search', activeFilters.search);
      if (activeFilters.minAmount !== undefined) params.append('minAmount', activeFilters.minAmount.toString());
      if (activeFilters.maxAmount !== undefined) params.append('maxAmount', activeFilters.maxAmount.toString());

      const response = await fetch(`/api/expenses?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch expenses');
      }

      const data = await response.json();
      set({ expenses: data, isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'An error occurred',
        isLoading: false 
      });
    }
  },

  createExpense: async (expense) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch('/api/expenses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(expense),
      });

      if (!response.ok) {
        throw new Error('Failed to create expense');
      }

      await get().fetchExpenses();
      set({ isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'An error occurred',
        isLoading: false 
      });
      throw error;
    }
  },

  updateExpense: async (id, expense) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`/api/expenses/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(expense),
      });

      if (!response.ok) {
        throw new Error('Failed to update expense');
      }

      await get().fetchExpenses();
      set({ isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'An error occurred',
        isLoading: false 
      });
      throw error;
    }
  },

  deleteExpense: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`/api/expenses/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete expense');
      }

      await get().fetchExpenses();
      set({ isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'An error occurred',
        isLoading: false 
      });
      throw error;
    }
  },
}));