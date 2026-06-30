import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '../types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      setAuth: (user: User, token: string): void => {
        set({ user, token, isAuthenticated: true });
      },
      logout: (): void => {
        set({ user: null, token: null, isAuthenticated: false });
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);