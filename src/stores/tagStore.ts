import { create } from 'zustand';
import api from '../utils/api';

interface Tag {
  id: number;
  user_id: number;
  name: string;
  color?: string;
  created_at: string;
  usage_count?: number;
}

interface TagState {
  tags: Tag[];
  isLoading: boolean;
  error: string | null;
  
  fetchTags: () => Promise<void>;
  addTag: (tag: Partial<Tag>) => Promise<void>;
  updateTag: (id: number, tag: Partial<Tag>) => Promise<void>;
  deleteTag: (id: number) => Promise<void>;
}

export const useTagStore = create<TagState>((set) => ({
  tags: [],
  isLoading: false,
  error: null,

  fetchTags: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get('/tags');
      set({ tags: response.data, isLoading: false });
    } catch (error: any) {
      set({ 
        error: error.response?.data?.error || 'Failed to fetch tags',
        isLoading: false 
      });
    }
  },

  addTag: async (tag: Partial<Tag>) => {
    try {
      const response = await api.post('/tags', tag);
      set(state => ({ tags: [...state.tags, response.data] }));
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to create tag');
    }
  },

  updateTag: async (id: number, tag: Partial<Tag>) => {
    try {
      const response = await api.put(`/tags/${id}`, tag);
      set(state => ({
        tags: state.tags.map(t => t.id === id ? response.data : t)
      }));
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to update tag');
    }
  },

  deleteTag: async (id: number) => {
    try {
      await api.delete(`/tags/${id}`);
      set(state => ({
        tags: state.tags.filter(t => t.id !== id)
      }));
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to delete tag');
    }
  },
}));