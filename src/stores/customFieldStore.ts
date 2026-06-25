import { create } from 'zustand';
import api from '../utils/api';

interface CustomField {
  id: number;
  user_id: number;
  name: string;
  field_type: 'text' | 'number' | 'date' | 'boolean' | 'select';
  options?: string[];
  is_required: boolean;
  created_at: string;
}

interface CustomFieldState {
  customFields: CustomField[];
  isLoading: boolean;
  error: string | null;
  
  fetchCustomFields: () => Promise<void>;
  addCustomField: (field: Partial<CustomField>) => Promise<void>;
  updateCustomField: (id: number, field: Partial<CustomField>) => Promise<void>;
  deleteCustomField: (id: number) => Promise<void>;
}

export const useCustomFieldStore = create<CustomFieldState>((set) => ({
  customFields: [],
  isLoading: false,
  error: null,

  fetchCustomFields: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get('/custom-fields');
      set({ customFields: response.data, isLoading: false });
    } catch (error: any) {
      set({ 
        error: error.response?.data?.error || 'Failed to fetch custom fields',
        isLoading: false 
      });
    }
  },

  addCustomField: async (field: Partial<CustomField>) => {
    try {
      const response = await api.post('/custom-fields', field);
      set(state => ({ customFields: [...state.customFields, response.data] }));
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to create custom field');
    }
  },

  updateCustomField: async (id: number, field: Partial<CustomField>) => {
    try {
      const response = await api.put(`/custom-fields/${id}`, field);
      set(state => ({
        customFields: state.customFields.map(f => f.id === id ? response.data : f)
      }));
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to update custom field');
    }
  },

  deleteCustomField: async (id: number) => {
    try {
      await api.delete(`/custom-fields/${id}`);
      set(state => ({
        customFields: state.customFields.filter(f => f.id !== id)
      }));
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to delete custom field');
    }
  },
}));