import { create } from 'zustand';

interface Category {
  id: number;
  user_id: number;
  name: string;
  color: string;
  icon?: string;
  created_at: string;
}

interface CategoryState {
  categories: Category[];
  isLoading: boolean;
  error: string | null;
  fetchCategories: () => Promise<void>;
  addCategory: (category: Partial<Category>) => Promise<void>;
  updateCategory: (id: number, category: Partial<Category>) => Promise<void>;
  deleteCategory: (id: number) => Promise<void>;
}

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
};

export const useCategoryStore = create<CategoryState>((set) => ({
  categories: [],
  isLoading: false,
  error: null,

  fetchCategories: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch('http://localhost:3001/api/categories', {
        headers: getAuthHeaders(),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch categories');
      }

      set({ categories: data.categories, isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch categories',
        isLoading: false 
      });
    }
  },

  addCategory: async (category) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch('http://localhost:3001/api/categories', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(category),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add category');
      }

      set(state => ({
        categories: [...state.categories, data.category],
        isLoading: false,
      }));
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to add category',
        isLoading: false 
      });
      throw error;
    }
  },

  updateCategory: async (id, category) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`http://localhost:3001/api/categories/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(category),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update category');
      }

      set(state => ({
        categories: state.categories.map(c => c.id === id ? data.category : c),
        isLoading: false,
      }));
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to update category',
        isLoading: false 
      });
      throw error;
    }
  },

  deleteCategory: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`http://localhost:3001/api/categories/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete category');
      }

      set(state => ({
        categories: state.categories.filter(c => c.id !== id),
        isLoading: false,
      }));
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to delete category',
        isLoading: false 
      });
      throw error;
    }
  },
}));