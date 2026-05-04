import { create } from 'zustand';

export interface AuthUser {
  username: string;
  id?: string;
}

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;

  login: (token: string, user: AuthUser) => void;
  logout: () => void;
  initFromStorage: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  isAuthenticated: false,

  login: (token, user) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('memolet_token', token);
      localStorage.setItem('memolet_user', JSON.stringify(user));
    }
    set({ token, user, isAuthenticated: true });
  },

  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('memolet_token');
      localStorage.removeItem('memolet_user');
    }
    set({ token: null, user: null, isAuthenticated: false });
  },

  initFromStorage: () => {
    if (typeof window === 'undefined') return;
    const token = localStorage.getItem('memolet_token');
    const userRaw = localStorage.getItem('memolet_user');
    if (token && userRaw) {
      try {
        const user: AuthUser = JSON.parse(userRaw);
        set({ token, user, isAuthenticated: true });
      } catch {
        localStorage.removeItem('memolet_token');
        localStorage.removeItem('memolet_user');
      }
    }
  },
}));
