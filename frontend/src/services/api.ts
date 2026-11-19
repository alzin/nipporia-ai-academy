// frontend/src/services/api.ts

import axios from 'axios';
import { store } from '../store/store';
import { clearAuth, setCSRFToken } from '../store/slices/authSlice';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important for cookies
});

// ---------- CSRF Token Setup in Request Interceptor ----------
api.interceptors.request.use(
  (config) => {
    const state = store.getState();
    const csrfToken = state.auth.csrfToken;

    if (
      csrfToken &&
      !['GET', 'HEAD', 'OPTIONS'].includes(config.method?.toUpperCase() || '')
    ) {
      config.headers['X-CSRF-Token'] = csrfToken;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ---------- Token Refresh Coordination ----------
let isRefreshing = false;
let refreshSubscribers: ((token: string | null) => void)[] = [];

function subscribeTokenRefresh(cb: (token: string | null) => void) {
  refreshSubscribers.push(cb);
}

// token === null means the refresh failed
function onRefreshed(token: string | null) {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
}

// ---------- Response Interceptor with Token Refresh Logic ----------
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    const url: string = originalRequest?.url || '';
    // Never try to refresh for the auth endpoints themselves
    const isAuthEndpoint = /\/auth\/(refresh|login|logout|check)/.test(url);

    // Check if response is 401 and hasn't been retried yet
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry && !isAuthEndpoint) {
      originalRequest._retry = true;

      // First request to refresh the token
      if (!isRefreshing) {
        isRefreshing = true;

        try {
          const response = await axios.post(
            `${API_URL}/auth/refresh`,
            {},
            { withCredentials: true }
          );

          const newCsrfToken = response.data.csrfToken;

          // Save the new CSRF token in the store
          store.dispatch(setCSRFToken(newCsrfToken));

          // Notify all subscribers waiting for the refresh
          onRefreshed(newCsrfToken);

          return api(originalRequest);
        } catch (refreshError) {
          isRefreshing = false;
          onRefreshed(null);

          // Session can't be refreshed. Guests simply stay guests;
          // a user whose session expired is sent to the login page.
          const wasAuthenticated = store.getState().auth.isAuthenticated;
          store.dispatch(clearAuth());
          if (wasAuthenticated && window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
          return Promise.reject(error);
        } finally {
          isRefreshing = false;
        }
      }

      // If a refresh is already in progress, wait for it to finish
      return new Promise((resolve, reject) => {
        subscribeTokenRefresh((newCsrfToken: string | null) => {
          if (!newCsrfToken) {
            reject(error);
            return;
          }
          originalRequest.headers['X-CSRF-Token'] = newCsrfToken;
          resolve(api(originalRequest));
        });
      });
    }

    // Writing in the community needs an active subscription.
    // Replace the raw code with a readable message for snackbars.
    if (error.response?.status === 403 && error.response?.data?.error === 'SUBSCRIPTION_REQUIRED') {
      error.isSubscriptionRequired = true;
      error.response.data = {
        ...error.response.data,
        error: 'メンバーになると使えます。',
        message: 'メンバーになると使えます。',
      };
    }

    return Promise.reject(error);
  }
);

export default api;
