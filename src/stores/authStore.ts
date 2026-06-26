import { create } from 'zustand';

interface User {
  id: number;
  email: string;
  name: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  fetchUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: localStorage.getItem('token'),
  isLoading: false,
  error: null,

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch('http://localhost:3001/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      localStorage.setItem('token', data.token);
      set({ user: data.user, token: data.token, isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Login failed',
        isLoading: false 
      });
    }
  },

  register: async (email: string, password: string, name: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch('http://localhost:3001/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      localStorage.setItem('token', data.token);
      set({ user: data.user, token: data.token, isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Registration failed',
        isLoading: false 
      });
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, token: null });
  },

  fetchUser: async () => {
    const token = get().token || localStorage.getItem('token');
    
    if (!token) {
      return;
    }

    set({ isLoading: true });
    try {
      const response = await fetch('http://localhost:3001/api/auth/me', {
        headers: { 
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        localStorage.removeItem('token');
        set({ user: null, token: null, isLoading: false });
        return;
      }

      set({ user: data.user, token, isLoading: false });
    } catch (error) {
      localStorage.removeItem('token');
      set({ user: null, token: null, isLoading: false });
    }
  },
}));