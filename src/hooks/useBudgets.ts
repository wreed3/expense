import { useState, useEffect, useCallback } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import type { Budget, BudgetFormData } from '../types';

interface UseBudgetsReturn {
  budgets: Budget[];
  loading: boolean;
  error: string | null;
  fetchBudgets: () => Promise<void>;
  createBudget: (data: BudgetFormData) => Promise<Budget | null>;
  updateBudget: (id: number, data: BudgetFormData) => Promise<Budget | null>;
  deleteBudget: (id: number) => Promise<boolean>;
}

export const useBudgets = (): UseBudgetsReturn => {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBudgets = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      const { data } = await api.get<Budget[]>('/api/budgets');
      setBudgets(data);
    } catch (err) {
      const message = 'Failed to fetch budgets';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const createBudget = async (budgetData: BudgetFormData): Promise<Budget | null> => {
    try {
      const { data } = await api.post<Budget>('/api/budgets', budgetData);
      setBudgets((prev) => [...prev, data]);
      toast.success('Budget created successfully');
      return data;
    } catch (err) {
      toast.error('Failed to create budget');
      return null;
    }
  };

  const updateBudget = async (id: number, budgetData: BudgetFormData): Promise<Budget | null> => {
    try {
      const { data } = await api.put<Budget>(`/api/budgets/${id}`, budgetData);
      setBudgets((prev) =>
        prev.map((budget) => (budget.id === id ? data : budget))
      );
      toast.success('Budget updated successfully');
      return data;
    } catch (err) {
      toast.error('Failed to update budget');
      return null;
    }
  };

  const deleteBudget = async (id: number): Promise<boolean> => {
    try {
      await api.delete(`/api/budgets/${id}`);
      setBudgets((prev) => prev.filter((budget) => budget.id !== id));
      toast.success('Budget deleted successfully');
      return true;
    } catch (err) {
      toast.error('Failed to delete budget');
      return false;
    }
  };

  useEffect(() => {
    fetchBudgets();
  }, [fetchBudgets]);

  return {
    budgets,
    loading,
    error,
    fetchBudgets,
    createBudget,
    updateBudget,
    deleteBudget,
  };
};