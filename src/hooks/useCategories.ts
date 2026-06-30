import { useState, useEffect, useCallback } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import type { Category, CategoryFormData } from '../types';

interface UseCategoriesReturn {
  categories: Category[];
  loading: boolean;
  error: string | null;
  fetchCategories: () => Promise<void>;
  createCategory: (data: CategoryFormData) => Promise<Category | null>;
  updateCategory: (id: number, data: CategoryFormData) => Promise<Category | null>;
  deleteCategory: (id: number) => Promise<boolean>;
}

export const useCategories = (): UseCategoriesReturn => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      const { data } = await api.get<Category[]>('/api/categories');
      setCategories(data);
    } catch (err) {
      const message = 'Failed to fetch categories';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const createCategory = async (categoryData: CategoryFormData): Promise<Category | null> => {
    try {
      const { data } = await api.post<Category>('/api/categories', categoryData);
      setCategories((prev) => [...prev, data]);
      toast.success('Category created successfully');
      return data;
    } catch (err) {
      toast.error('Failed to create category');
      return null;
    }
  };

  const updateCategory = async (id: number, categoryData: CategoryFormData): Promise<Category | null> => {
    try {
      const { data } = await api.put<Category>(`/api/categories/${id}`, categoryData);
      setCategories((prev) =>
        prev.map((category) => (category.id === id ? data : category))
      );
      toast.success('Category updated successfully');
      return data;
    } catch (err) {
      toast.error('Failed to update category');
      return null;
    }
  };

  const deleteCategory = async (id: number): Promise<boolean> => {
    try {
      await api.delete(`/api/categories/${id}`);
      setCategories((prev) => prev.filter((category) => category.id !== id));
      toast.success('Category deleted successfully');
      return true;
    } catch (err) {
      toast.error('Failed to delete category');
      return false;
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  return {
    categories,
    loading,
    error,
    fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory,
  };
};