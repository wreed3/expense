import { create } from 'zustand';
import { TagState, Tag } from '../types';
import api from '../utils/api';

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