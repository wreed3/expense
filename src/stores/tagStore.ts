import { create } from 'zustand';

export interface Tag {
  id: number;
  user_id: number;
  name: string;
  color: string;
  created_at?: string;
  expense_count?: number;
}

interface TagState {
  tags: Tag[];
  isLoading: boolean;
  error: string | null;
  fetchTags: () => Promise<void>;
  createTag: (data: { name: string; color?: string }) => Promise<Tag>;
  updateTag: (id: number, data: { name?: string; color?: string }) => Promise<void>;
  deleteTag: (id: number) => Promise<void>;
  searchTags: (query: string) => Promise<Tag[]>;
}

export const useTagStore = create<TagState>((set, get) => ({
  tags: [],
  isLoading: false,
  error: null,

  fetchTags: async () => {
    set({ isLoading: true, error: null });
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/tags', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch tags');

      const data = await response.json();
      set({ tags: data, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  createTag: async (data) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/tags', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error('Failed to create tag');

      const tag = await response.json();
      set(state => ({ tags: [...state.tags, tag] }));
      return tag;
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    }
  },

  updateTag: async (id, data) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/api/tags/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error('Failed to update tag');

      const updatedTag = await response.json();
      set(state => ({
        tags: state.tags.map(t => t.id === id ? updatedTag : t),
      }));
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    }
  },

  deleteTag: async (id) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/api/tags/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to delete tag');

      set(state => ({
        tags: state.tags.filter(t => t.id !== id),
      }));
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    }
  },

  searchTags: async (query) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/api/tags/search?q=${encodeURIComponent(query)}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to search tags');

      return await response.json();
    } catch (error: any) {
      set({ error: error.message });
      return [];
    }
  },
}));