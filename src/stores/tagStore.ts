import { create } from 'zustand';

export interface Tag {
  id: number;
  name: string;
  user_id: number;
  created_at: string;
}

interface TagState {
  tags: Tag[];
  isLoading: boolean;
  error: string | null;
  fetchTags: () => Promise<void>;
  addTag: (name: string) => Promise<void>;
  deleteTag: (id: number) => Promise<void>;
  getTagsByExpense: (expenseId: number) => Promise<string[]>;
}

export const useTagStore = create<TagState>((set, get) => ({
  tags: [],
  isLoading: false,
  error: null,

  fetchTags: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch('/api/tags', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch tags');
      }

      const data = await response.json();
      set({ tags: data, isLoading: false });
    } catch (error) {
      console.error('Error fetching tags:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch tags',
        isLoading: false
      });
    }
  },

  addTag: async (name: string) => {
    set({ isLoading: true, error: null });
    try {
      // Check if tag already exists
      const existingTag = get().tags.find(t => t.name.toLowerCase() === name.toLowerCase());
      if (existingTag) {
        set({ isLoading: false });
        return;
      }

      const response = await fetch('/api/tags', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ name })
      });

      if (!response.ok) {
        throw new Error('Failed to add tag');
      }

      const newTag = await response.json();
      set(state => ({
        tags: [...state.tags, newTag],
        isLoading: false
      }));
    } catch (error) {
      console.error('Error adding tag:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to add tag',
        isLoading: false
      });
      throw error;
    }
  },

  deleteTag: async (id: number) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`/api/tags/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete tag');
      }

      set(state => ({
        tags: state.tags.filter(t => t.id !== id),
        isLoading: false
      }));
    } catch (error) {
      console.error('Error deleting tag:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to delete tag',
        isLoading: false
      });
      throw error;
    }
  },

  getTagsByExpense: async (expenseId: number) => {
    try {
      const response = await fetch(`/api/expenses/${expenseId}/tags`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch expense tags');
      }

      const data = await response.json();
      return data.tags || [];
    } catch (error) {
      console.error('Error fetching expense tags:', error);
      return [];
    }
  }
}));