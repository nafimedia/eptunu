import { writable } from 'svelte/store';
import type { User } from '$types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const initialToken = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
const initialUser = typeof window !== 'undefined' && localStorage.getItem('user')
  ? JSON.parse(localStorage.getItem('user')!)
  : null;

export const auth = writable<AuthState>({
  user: initialUser,
  token: initialToken,
  isAuthenticated: !!initialToken,
  isLoading: false,
});

export function setAuth(token: string, user: User) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
  }
  auth.set({
    token,
    user,
    isAuthenticated: true,
    isLoading: false,
  });
}

export function clearAuth() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
  auth.set({
    token: null,
    user: null,
    isAuthenticated: false,
    isLoading: false,
  });
}

export function hasPermission(user: User | null, requiredPerm: string): boolean {
  if (!user) return false;
  if (user.role === 'SUPER_ADMIN') return true;
  return user.permissions ? user.permissions.includes(requiredPerm) : false;
}
