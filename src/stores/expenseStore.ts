import { create } from 'zustand';
import { ExpenseState, Expense, ExpenseFilters } from '../types';
import api from '../utils/api';

export const useExpenseStore = create<ExpenseState>((set, get) => ({
  expenses: [],
  filters: {},
  pagination: null,
  isLoading: false,
  error: null,

  fetchExpenses: async (filters?: ExpenseFilters) => {
    set({ isLoading: true, error: null });
    try {
      const params = filters || get().filters;
      const response = await api.get('/expenses', { params });
      set({ 
        expenses: response.data.expenses,
        pagination: response.data.pagination,
        filters: params,
        isLoading: false 
      });
    } catch (error: any) {
      set({ 
        error: error.response?.data?.error || 'Failed to fetch expenses',
        isLoading: false 
      });
    }
  },

  addExpense: async (expense: Partial<Expense>, receipt?: File) => {
    try {
      const formData = new FormData();
      
      Object.entries(expense).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (key === 'tags' || key === 'custom_fields') {
            formData.append(key, JSON.stringify(value));
          } else {
            formData.append(key, String(value));
          }
        }
      });

      if (receipt) {
        formData.append('receipt', receipt);
      }

      const response = await api.post('/expenses', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      await get().fetchExpenses();
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to create expense');
    }
  },

  updateExpense: async (id: number, expense: Partial<Expense>, receipt?: File) => {
    try {
      const formData = new FormData();
      
      Object.entries(expense).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (key === 'tags' || key === 'custom_fields') {
            formData.append(key, JSON.stringify(value));
          } else {
            formData.append(key, String(value));
          }
        }
      });

      if (receipt) {
        formData.append('receipt', receipt);
      }

      const response = await api.put(`/expenses/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      await get().fetchExpenses();
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to update expense');
    }
  },

  deleteExpense: async (id: number) => {
    try {
      await api.delete(`/expenses/${id}`);
      set(state => ({
        expenses: state.expenses.filter(e => e.id !== id)
      }));
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to delete expense');
    }
  },

  bulkDelete: async (ids: number[]) => {
    try {
      await api.post('/expenses/bulk/delete', { ids });
      set(state => ({
        expenses: state.expenses.filter(e => !ids.includes(e.id))
      }));
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to delete expenses');
    }
  },

  bulkTag: async (expenseIds: number[], tagIds: number[]) => {
    try {
      await api.post('/expenses/bulk/tag', { expense_ids: expenseIds, tag_ids: tagIds });
      await get().fetchExpenses();
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to tag expenses');
    }
  },

  setFilters: (filters: ExpenseFilters) => {
    set({ filters });
  },

  clearFilters: () => {
    set({ filters: {} });
    get().fetchExpenses({});
  },
}));