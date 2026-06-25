import { create } from 'zustand';

export type CustomFieldType = 'text' | 'number' | 'date' | 'boolean' | 'select';

export interface CustomField {
  id: number;
  user_id: number;
  name: string;
  field_type: CustomFieldType;
  options?: string[];
  is_required: boolean;
  created_at?: string;
}

export interface CustomFieldValue {
  field_id: number;
  value: string;
}

interface CustomFieldState {
  customFields: CustomField[];
  isLoading: boolean;
  error: string | null;
  fetchCustomFields: () => Promise<void>;
  createCustomField: (data: {
    name: string;
    field_type: CustomFieldType;
    options?: string[];
    is_required?: boolean;
  }) => Promise<CustomField>;
  updateCustomField: (id: number, data: Partial<CustomField>) => Promise<void>;
  deleteCustomField: (id: number) => Promise<void>;
}

export const useCustomFieldStore = create<CustomFieldState>((set, get) => ({
  customFields: [],
  isLoading: false,
  error: null,

  fetchCustomFields: async () => {
    set({ isLoading: true, error: null });
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/custom-fields', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch custom fields');

      const data = await response.json();
      set({ customFields: data, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  createCustomField: async (data) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/custom-fields', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error('Failed to create custom field');

      const field = await response.json();
      set(state => ({ customFields: [...state.customFields, field] }));
      return field;
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    }
  },

  updateCustomField: async (id, data) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/api/custom-fields/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error('Failed to update custom field');

      const updatedField = await response.json();
      set(state => ({
        customFields: state.customFields.map(f => f.id === id ? updatedField : f),
      }));
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    }
  },

  deleteCustomField: async (id) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/api/custom-fields/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to delete custom field');

      set(state => ({
        customFields: state.customFields.filter(f => f.id !== id),
      }));
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    }
  },
}));