// frontend/src/services/authService.ts
import api from './api';

interface LoginResponse {
  user: {
    id: string;
    email: string;
    role: string;
    name?: string;
  };
  csrfToken: string;
}

interface CheckAuthResponse {
  authenticated: boolean;
  csrfToken?: string;
  user?: {
    id: string;
    email: string;
    role: string;
    name?: string;
  };
}

export const authService = {
  async login(email: string, password: string): Promise<LoginResponse> {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },

  async logout(): Promise<void> {
    await api.post('/auth/logout');
  },

  async register(email: string, stripePaymentIntentId: string): Promise<void> {
    await api.post('/auth/register', { email, stripePaymentIntentId });
  },

  async refresh(): Promise<LoginResponse> {
    const response = await api.post('/auth/refresh');
    return response.data;
  },

  // Never throws: a failed check means "guest".
  async checkAuth(): Promise<CheckAuthResponse> {
    try {
      const response = await api.get('/auth/check');
      if (response.data?.authenticated) return response.data;
    } catch (error) {
      // fall through to refresh
    }
    // The access token may have expired while the refresh token is still valid.
    try {
      const refreshed = await api.post('/auth/refresh');
      if (refreshed.data?.user) {
        return { authenticated: true, user: refreshed.data.user, csrfToken: refreshed.data.csrfToken };
      }
    } catch (error) {
      // guest
    }
    return { authenticated: false };
  },
};
