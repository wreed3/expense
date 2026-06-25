import { create } from 'zustand';

export interface CustomField {
  id: number;
  name: string;
  type: 'text' | 'number' | 'date' | 'boolean' | 'select';
  options?: string[]; // For select type
  required: boolean;
  user_id: number;
}

interface CustomFieldState {
  customFields: CustomField[];
  isLoading: boolean;
  error: string | null;
  fetchCustomFields: () => Promise<void>;
  addCustomField: (field: Omit<CustomField, 'id' | 'user_id'>) => Promise<void>;
  updateCustomField: (id: number, field: Partial<CustomField>) => Promise<void>;
  deleteCustomField: (id: number) => Promise<void>;
}

export const useCustomFieldStore = create<CustomFieldState>((set, get) => ({
  customFields: [],
  isLoading: false,
  error: null,

  fetchCustomFields: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch('/api/custom-fields', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch custom fields');
      }

      const data = await response.json();
      set({ customFields: data, isLoading: false });
    } catch (error) {
      console.error('Error fetching custom fields:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch custom fields',
        isLoading: false
      });
    }
  },

  addCustomField: async (field) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch('/api/custom-fields', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(field)
      });

      if (!response.ok) {
        throw new Error('Failed to add custom field');
      }

      const newField = await response.json();
      set(state => ({
        customFields: [...state.customFields, newField],
        isLoading: false
      }));
    } catch (error) {
      console.error('Error adding custom field:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to add custom field',
        isLoading: false
      });
      throw error;
    }
  },

  updateCustomField: async (id, field) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`/api/custom-fields/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(field)
      });

      if (!response.ok) {
        throw new Error('Failed to update custom field');
      }

      const updatedField = await response.json();
      set(state => ({
        customFields: state.customFields.map(f =>
          f.id === id ? updatedField : f
        ),
        isLoading: false
      }));
    } catch (error) {
      console.error('Error updating custom field:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to update custom field',
        isLoading: false
      });
      throw error;
    }
  },

  deleteCustomField: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`/api/custom-fields/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete custom field');
      }

      set(state => ({
        customFields: state.customFields.filter(f => f.id !== id),
        isLoading: false
      }));
    } catch (error) {
      console.error('Error deleting custom field:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to delete custom field',
        isLoading: false
      });
      throw error;
    }
  }
}));