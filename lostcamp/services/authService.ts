import { useAuthStore } from '../store/useAuthStore';

let onUnauthorizedHandler: (() => void) | null = null;

export const authService = {
  setToken(_token: string | null) {
    // Auth token is managed purely via httpOnly cookie on server
  },

  getToken(): string | null {
    return null;
  },

  setOnUnauthorized(handler: () => void) {
    onUnauthorizedHandler = handler;
  },

  triggerUnauthorized() {
    useAuthStore.getState().logout();
    if (onUnauthorizedHandler) {
      onUnauthorizedHandler();
    }
  },

  getAuthHeaders(): Record<string, string> {
    return useAuthStore.getState().getAuthHeaders();
  },

  async login(password: string): Promise<{ success: boolean; token?: string; error?: string }> {
    return useAuthStore.getState().adminLogin(password);
  },

  logout() {
    useAuthStore.getState().logout();
  },
};
