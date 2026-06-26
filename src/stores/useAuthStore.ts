import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import apiClient, { ApiError } from '../utils/api';

interface User {
  id: number;
  email: string;
  name?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await apiClient.post('/auth/login', { email, password });
          const { token, user } = response.data;
          
          localStorage.setItem('token', token);
          set({ 
            user, 
            token, 
            isAuthenticated: true, 
            isLoading: false,
            error: null 
          });
        } catch (error) {
          const apiError = error as ApiError;
          set({ 
            error: apiError.message || 'Login failed', 
            isLoading: false,
            isAuthenticated: false 
          });
          throw error;
        }
      },

      register: async (email: string, password: string, name?: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await apiClient.post('/auth/register', { 
            email, 
            password, 
            name 
          });
          const { token, user } = response.data;
          
          localStorage.setItem('token', token);
          set({ 
            user, 
            token, 
            isAuthenticated: true, 
            isLoading: false,
            error: null 
          });
        } catch (error) {
          const apiError = error as ApiError;
          set({ 
            error: apiError.message || 'Registration failed', 
            isLoading: false,
            isAuthenticated: false 
          });
          throw error;
        }
      },

      logout: () => {
        localStorage.removeItem('token');
        set({ 
          user: null, 
          token: null, 
          isAuthenticated: false,
          error: null 
        });
      },

      clearError: () => {
        set({ error: null });
      },

      checkAuth: async () => {
        const token = localStorage.getItem('token');
        if (!token) {
          set({ isAuthenticated: false, user: null, token: null });
          return;
        }

        try {
          const response = await apiClient.get('/auth/me');
          set({ 
            user: response.data.user, 
            token,
            isAuthenticated: true,
            error: null 
          });
        } catch (error) {
          localStorage.removeItem('token');
          set({ 
            user: null, 
            token: null, 
            isAuthenticated: false,
            error: null 
          });
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated 
      }),
    }
  )
);