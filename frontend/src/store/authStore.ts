import { useState, useEffect } from 'react';
import { User, AuthSession } from '../types';

let currentUser: User | null = null;
const listeners = new Set<(user: User | null) => void>();

export const authStore = {
  getUser: (): User | null => {
    if (!currentUser) {
      const stored = localStorage.getItem('quicksync_user');
      if (stored) {
        try {
          currentUser = JSON.parse(stored);
        } catch {
          currentUser = null;
        }
      }
    }
    return currentUser;
  },

  setSession: (session: AuthSession) => {
    currentUser = session.user;
    localStorage.setItem('quicksync_token', session.access_token);
    localStorage.setItem('quicksync_refresh_token', session.refresh_token);
    localStorage.setItem('quicksync_user', JSON.stringify(session.user));
    listeners.forEach((listener) => listener(currentUser));
  },

  clearSession: () => {
    currentUser = null;
    localStorage.removeItem('quicksync_token');
    localStorage.removeItem('quicksync_refresh_token');
    localStorage.removeItem('quicksync_user');
    listeners.forEach((listener) => listener(null));
  },

  subscribe: (listener: (user: User | null) => void) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },

  hasRole: (allowedRoles: string[]): boolean => {
    const u = authStore.getUser();
    return u ? allowedRoles.includes(u.role) : false;
  }
};

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(authStore.getUser());

  useEffect(() => {
    const unsubscribe = authStore.subscribe(setUser);
    return unsubscribe;
  }, []);

  return {
    user,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'ADMIN',
    isOperator: user?.role === 'OPERATOR' || user?.role === 'ADMIN',
    login: authStore.setSession,
    logout: authStore.clearSession,
  };
};
