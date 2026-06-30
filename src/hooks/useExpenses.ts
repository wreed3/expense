import { useState, useEffect, useCallback } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import type { Expense, ExpenseFormData, ExpenseFilters } from '../types';

interface UseExpensesReturn {
  expenses: Expense[];
  loading: boolean;
  error: string | null;
  fetchExpenses: (filters?: ExpenseFilters) => Promise<void>;
  createExpense: (data: ExpenseFormData) => Promise<Expense | null>;
  updateExpense: (id: number, data: ExpenseFormData) => Promise<Expense | null>;
  deleteExpense: (id: number) => Promise<boolean>;
  uploadReceipt: (id: number, file: File) => Promise<boolean>;
}

export const useExpenses = (): UseExpensesReturn => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchExpenses = useCallback(async (filters?: ExpenseFilters): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      const { data } = await api.get<Expense[]>('/api/expenses', { params: filters });
      setExpenses(data);
    } catch (err) {
      const message = 'Failed to fetch expenses';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const createExpense = async (expenseData: ExpenseFormData): Promise<Expense | null> => {
    try {
      const { data } = await api.post<Expense>('/api/expenses', expenseData);
      setExpenses((prev) => [data, ...prev]);
      toast.success('Expense created successfully');
      return data;
    } catch (err) {
      toast.error('Failed to create expense');
      return null;
    }
  };

  const updateExpense = async (id: number, expenseData: ExpenseFormData): Promise<Expense | null> => {
    try {
      const { data } = await api.put<Expense>(`/api/expenses/${id}`, expenseData);
      setExpenses((prev) =>
        prev.map((expense) => (expense.id === id ? data : expense))
      );
      toast.success('Expense updated successfully');
      return data;
    } catch (err) {
      toast.error('Failed to update expense');
      return null;
    }
  };

  const deleteExpense = async (id: number): Promise<boolean> => {
    try {
      await api.delete(`/api/expenses/${id}`);
      setExpenses((prev) => prev.filter((expense) => expense.id !== id));
      toast.success('Expense deleted successfully');
      return true;
    } catch (err) {
      toast.error('Failed to delete expense');
      return false;
    }
  };

  const uploadReceipt = async (id: number, file: File): Promise<boolean> => {
    try {
      const formData = new FormData();
      formData.append('receipt', file);
      await api.post(`/api/expenses/${id}/receipt`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Receipt uploaded successfully');
      await fetchExpenses();
      return true;
    } catch (err) {
      toast.error('Failed to upload receipt');
      return false;
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  return {
    expenses,
    loading,
    error,
    fetchExpenses,
    createExpense,
    updateExpense,
    deleteExpense,
    uploadReceipt,
  };
};