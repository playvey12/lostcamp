import { create } from 'zustand';
import { DeliveryInfo } from '../types';

export interface User {
  id?: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role?: string;
  birthDate?: string;
  age?: number | string;
  address?: string;
  deliveryInfo?: DeliveryInfo | null;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAdmin: boolean;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (email: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  adminLogin: (password: string) => Promise<{ success: boolean; error?: string }>;
  register: (data: { email: string; password?: string; firstName?: string; lastName?: string; birthDate?: string; address?: string }) => Promise<{ success: boolean; requiresVerification?: boolean; email?: string; message?: string; error?: string }>;
  verifyRegistrationCode: (email: string, code: string) => Promise<{ success: boolean; error?: string }>;
  updateProfile: (data: { age?: number | string; address: string; firstName?: string; lastName?: string; birthDate?: string; deliveryInfo?: DeliveryInfo | null }) => Promise<{ success: boolean; error?: string }>;
  changePassword: (oldPassword: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  requestEmailChange: (newEmail: string) => Promise<{ success: boolean; message?: string; error?: string }>;
  confirmEmailChange: (newEmail: string, code: string) => Promise<{ success: boolean; message?: string; error?: string }>;
  forgotPassword: (email: string) => Promise<{ success: boolean; error?: string; message?: string }>;
  verifyCode: (email: string, code: string) => Promise<{ success: boolean; error?: string }>;
  resetPassword: (email: string, code: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void | Promise<void>;
  checkAuth: () => Promise<void>;
  verifyAdmin: () => Promise<boolean>;
  getAuthHeaders: () => Record<string, string>;
  clearError: () => void;
  setUser: (user: User | null) => void;
}

const USER_KEY = 'lostcamp_user';

let storedUser: User | null = null;
try {
  const parsed = localStorage.getItem(USER_KEY);
  if (parsed) storedUser = JSON.parse(parsed);
} catch (e) {
  storedUser = null;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: storedUser,
  token: null,
  isAdmin: storedUser?.role === 'admin',
  isAuthenticated: !!storedUser,
  isLoading: false,
  error: null,

  setUser: (user) => {
    if (user) {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(USER_KEY);
    }
    set({
      user,
      isAdmin: user?.role === 'admin',
      isAuthenticated: !!user,
    });
  },

  getAuthHeaders: () => {
    return {
      'Content-Type': 'application/json',
    };
  },

  login: async (email: string, password?: string) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        const errorMsg = data.error || 'Ошибка входа';
        set({ isLoading: false, error: errorMsg });
        return { success: false, error: errorMsg };
      }

      const user = data.user || { email, role: 'user' };
      localStorage.setItem(USER_KEY, JSON.stringify(user));

      set({
        token: data.token || null,
        user,
        isAdmin: user.role === 'admin',
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });

      return { success: true };
    } catch (err: any) {
      const errorMsg = err.message || 'Ошибка подключения к серверу';
      set({ isLoading: false, error: errorMsg });
      return { success: false, error: errorMsg };
    }
  },

  adminLogin: async (password: string) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch('/api/auth/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ password }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        const errorMsg = data.error || 'Неверный пароль администратора!';
        set({ isLoading: false, error: errorMsg });
        return { success: false, error: errorMsg };
      }

      const user = data.user || { email: 'admin@lostcamp.ru', role: 'admin', firstName: 'Администратор' };
      localStorage.setItem(USER_KEY, JSON.stringify(user));

      set({
        token: data.token || null,
        user,
        isAdmin: true,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });

      return { success: true };
    } catch (err: any) {
      const errorMsg = err.message || 'Ошибка проверки пароля';
      set({ isLoading: false, error: errorMsg });
      return { success: false, error: errorMsg };
    }
  },

  register: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      const resData = await res.json();

      if (!res.ok || !resData.success) {
        const errorMsg = resData.error || 'Ошибка регистрации';
        set({ isLoading: false, error: errorMsg });
        return { success: false, error: errorMsg };
      }

      if (resData.requiresVerification) {
        set({ isLoading: false, error: null });
        return {
          success: true,
          requiresVerification: true,
          email: resData.email,
          message: resData.message,
        };
      }

      const user = resData.user;
      if (user) {
        localStorage.setItem(USER_KEY, JSON.stringify(user));
        set({
          token: null,
          user,
          isAdmin: false,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
      }

      return { success: true };
    } catch (err: any) {
      const errorMsg = err.message || 'Ошибка соединения при регистрации';
      set({ isLoading: false, error: errorMsg });
      return { success: false, error: errorMsg };
    }
  },

  verifyRegistrationCode: async (email: string, code: string) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch('/api/auth/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, code }),
      });
      const resData = await res.json();

      if (!res.ok || !resData.success) {
        const errorMsg = resData.error || 'Неверный или просроченный код подтверждения';
        set({ isLoading: false, error: errorMsg });
        return { success: false, error: errorMsg };
      }

      const user = resData.user;
      if (user) {
        localStorage.setItem(USER_KEY, JSON.stringify(user));
        set({
          token: null,
          user,
          isAdmin: false,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
      }

      return { success: true };
    } catch (err: any) {
      const errorMsg = err.message || 'Ошибка проверки кода подтверждения';
      set({ isLoading: false, error: errorMsg });
      return { success: false, error: errorMsg };
    }
  },

  updateProfile: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const headers = get().getAuthHeaders();
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers,
        credentials: 'include',
        body: JSON.stringify(data),
      });
      const resData = await res.json();

      if (!res.ok || resData.success === false) {
        const errorMsg = resData.error || 'Ошибка при обновлении профиля';
        set({ isLoading: false, error: errorMsg });
        return { success: false, error: errorMsg };
      }

      const updatedUser = resData.data || resData.user;
      if (updatedUser) {
        localStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
        set({
          user: updatedUser,
          isLoading: false,
          error: null,
        });
      } else {
        set({ isLoading: false });
      }

      return { success: true };
    } catch (err: any) {
      const errorMsg = err.message || 'Сетевая ошибка при обновлении профиля';
      set({ isLoading: false, error: errorMsg });
      return { success: false, error: errorMsg };
    }
  },

  changePassword: async (oldPassword: string, newPassword: string) => {
    set({ isLoading: true, error: null });
    try {
      const headers = get().getAuthHeaders();
      const res = await fetch('/api/user/change-password', {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({ oldPassword, newPassword }),
      });
      const resData = await res.json();

      if (!res.ok || resData.success === false) {
        const errorMsg = resData.error || 'Не удалось сменить пароль';
        set({ isLoading: false, error: errorMsg });
        return { success: false, error: errorMsg };
      }

      if (resData.user) {
        localStorage.setItem(USER_KEY, JSON.stringify(resData.user));
        set({ user: resData.user });
      }

      set({ isLoading: false, error: null });
      return { success: true };
    } catch (err: any) {
      const errorMsg = err.message || 'Ошибка соединения при смене пароля';
      set({ isLoading: false, error: errorMsg });
      return { success: false, error: errorMsg };
    }
  },

  requestEmailChange: async (newEmail: string) => {
    set({ isLoading: true, error: null });
    try {
      const headers = get().getAuthHeaders();
      const res = await fetch('/api/user/change-email/request', {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({ newEmail }),
      });
      const resData = await res.json();

      if (!res.ok || resData.success === false) {
        const errorMsg = resData.error || 'Не удалось отправить код подтверждения';
        set({ isLoading: false, error: errorMsg });
        return { success: false, error: errorMsg };
      }

      set({ isLoading: false, error: null });
      return { success: true, message: resData.message };
    } catch (err: any) {
      const errorMsg = err.message || 'Сетевая ошибка при запросе смены email';
      set({ isLoading: false, error: errorMsg });
      return { success: false, error: errorMsg };
    }
  },

  confirmEmailChange: async (newEmail: string, code: string) => {
    set({ isLoading: true, error: null });
    try {
      const headers = get().getAuthHeaders();
      const res = await fetch('/api/user/change-email/confirm', {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({ newEmail, code }),
      });
      const resData = await res.json();

      if (!res.ok || resData.success === false) {
        const errorMsg = resData.error || 'Не удалось подтвердить смену email';
        set({ isLoading: false, error: errorMsg });
        return { success: false, error: errorMsg };
      }

      const updatedUser = resData.user || resData.data;
      if (updatedUser) {
        localStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
        set({
          user: updatedUser,
          token: resData.token || get().token,
          isLoading: false,
          error: null,
        });
      } else {
        set({ isLoading: false });
      }

      return { success: true, message: resData.message };
    } catch (err: any) {
      const errorMsg = err.message || 'Ошибка соединения при подтверждении смены email';
      set({ isLoading: false, error: errorMsg });
      return { success: false, error: errorMsg };
    }
  },

  forgotPassword: async (email: string) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email }),
      });
      const resData = await res.json();

      if (!res.ok || resData.success === false) {
        const errorMsg = resData.error || 'Ошибка при запросе сброса пароля';
        set({ isLoading: false, error: errorMsg });
        return { success: false, error: errorMsg };
      }

      set({ isLoading: false, error: null });
      return { success: true, message: resData.message };
    } catch (err: any) {
      const errorMsg = err.message || 'Сетевая ошибка при сбросе пароля';
      set({ isLoading: false, error: errorMsg });
      return { success: false, error: errorMsg };
    }
  },

  verifyCode: async (email: string, code: string) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch('/api/auth/verify-reset-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, code }),
      });
      const resData = await res.json();

      if (!res.ok || resData.success === false) {
        const errorMsg = resData.error || 'Неверный код сброса пароля';
        set({ isLoading: false, error: errorMsg });
        return { success: false, error: errorMsg };
      }

      set({ isLoading: false, error: null });
      return { success: true };
    } catch (err: any) {
      const errorMsg = err.message || 'Ошибка проверки кода';
      set({ isLoading: false, error: errorMsg });
      return { success: false, error: errorMsg };
    }
  },

  resetPassword: async (email: string, code: string, newPassword: string) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, code, newPassword }),
      });
      const resData = await res.json();

      if (!res.ok || resData.success === false) {
        const errorMsg = resData.error || 'Ошибка при установке нового пароля';
        set({ isLoading: false, error: errorMsg });
        return { success: false, error: errorMsg };
      }

      set({ isLoading: false, error: null });
      return { success: true };
    } catch (err: any) {
      const errorMsg = err.message || 'Ошибка при сбросе пароля';
      set({ isLoading: false, error: errorMsg });
      return { success: false, error: errorMsg };
    }
  },

  logout: async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } catch (_e) {
      // Ignore network errors on logout
    }
    localStorage.removeItem(USER_KEY);
    set({
      user: null,
      token: null,
      isAdmin: false,
      isAuthenticated: false,
      error: null,
    });
  },

  checkAuth: async () => {
    try {
      const res = await fetch('/api/auth/me', {
        headers: get().getAuthHeaders(),
        credentials: 'include',
      });

      const contentType = res.headers.get('content-type');
      if (res.ok && contentType && contentType.includes('application/json')) {
        const data = await res.json();
        if (data.success && data.user) {
          localStorage.setItem(USER_KEY, JSON.stringify(data.user));
          set({
            user: data.user,
            isAdmin: data.user.role === 'admin',
            isAuthenticated: true,
          });
          return;
        }
      }

      if (res.status === 401 || res.status === 403) {
        localStorage.removeItem(USER_KEY);
        set({
          user: null,
          token: null,
          isAdmin: false,
          isAuthenticated: false,
        });
      }
    } catch (e) {
      console.error('Failed to verify token:', e);
    }
  },

  verifyAdmin: async (): Promise<boolean> => {
    try {
      const res = await fetch('/api/auth/me', {
        headers: get().getAuthHeaders(),
        credentials: 'include',
      });

      const contentType = res.headers.get('content-type');
      if (res.ok && contentType && contentType.includes('application/json')) {
        const data = await res.json();
        if (data.success && data.user && data.user.role === 'admin') {
          localStorage.setItem(USER_KEY, JSON.stringify(data.user));
          set({
            user: data.user,
            isAdmin: true,
            isAuthenticated: true,
          });
          return true;
        }
      }

      if (res.status === 401 || res.status === 403) {
        localStorage.removeItem(USER_KEY);
        set({
          user: null,
          token: null,
          isAdmin: false,
          isAuthenticated: false,
        });
      } else {
        set({ isAdmin: false });
      }
      return false;
    } catch (e) {
      console.error('Failed to verify admin status:', e);
      set({ isAdmin: false });
      return false;
    }
  },

  clearError: () => set({ error: null }),
}));
