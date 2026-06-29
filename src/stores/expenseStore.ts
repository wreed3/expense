import { create } from 'zustand';
import { Expense, ExpenseFilters } from '../types';
import { api } from '../utils/api';

interface ExpenseState {
  expenses: Expense[];
  isLoading: boolean;
  error: string | null;
  filters: ExpenseFilters;
  setFilters: (filters: Partial<ExpenseFilters>) => void;
  fetchExpenses: () => Promise<void>;
  addExpense: (expense: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateExpense: (id: number, expense: Partial<Expense>) => Promise<void>;
  deleteExpense: (id: number) => Promise<void>;
}

export const useExpenseStore = create<ExpenseState>((set, get) => ({
  expenses: [],
  isLoading: false,
  error: null,
  filters: {},

  setFilters: (filters) => {
    set((state) => ({
      filters: { ...state.filters, ...filters },
    }));
    get().fetchExpenses();
  },

  fetchExpenses: async () => {
    set({ isLoading: true, error: null });
    try {
      const { filters } = get();
      const params = new URLSearchParams();
      
      if (filters.categoryId) params.append('categoryId', filters.categoryId.toString());
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.search) params.append('search', filters.search);

      const expenses = await api.get<Expense[]>(`/expenses?${params.toString()}`);
      set({ expenses, isLoading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to fetch expenses', isLoading: false });
    }
  },

  addExpense: async (expense) => {
    set({ isLoading: true, error: null });
    try {
      await api.post('/expenses', expense);
      await get().fetchExpenses();
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to add expense', isLoading: false });
      throw error;
    }
  },

  updateExpense: async (id, expense) => {
    set({ isLoading: true, error: null });
    try {
      await api.put(`/expenses/${id}`, expense);
      await get().fetchExpenses();
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to update expense', isLoading: false });
      throw error;
    }
  },

  deleteExpense: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await api.delete(`/expenses/${id}`);
      await get().fetchExpenses();
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to delete expense', isLoading: false });
      throw error;
    }
  },
}));