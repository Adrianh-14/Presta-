import api from './api';
import { tokenStore } from './tokenStore';

const persistAuth = (data) => {
  tokenStore.setAccessToken(data.accessToken);
  localStorage.setItem('user', JSON.stringify(data.user));
  if (data.refreshToken) localStorage.setItem('refreshToken', data.refreshToken);
  else localStorage.removeItem('refreshToken');
};

const refreshRequest = () => {
  const refreshToken = localStorage.getItem('refreshToken');
  return api.post('/api/auth/refresh', refreshToken ? { refreshToken } : {});
};

export const authService = {
  login: async (email, password) => {
    const { data } = await api.post('/api/auth/login', { email, password });
    persistAuth(data);
    return data;
  },
  requestPasswordReset: async (email) => (await api.post('/api/auth/password-reset/request', { email })).data,
  confirmPasswordReset: async (token, newPassword) => (await api.post('/api/auth/password-reset/confirm', { token, newPassword })).data,
  requestEmailVerification: async (email, purpose) => (await api.post('/api/auth/email-verification/request', { email, purpose })).data,
  confirmEmailVerification: async (email, purpose, code) => (await api.post('/api/auth/email-verification/confirm', { email, purpose, code })).data,

  register: async (email, password, nombre, role = 'Client') => {
    const { data } = await api.post('/api/auth/register', { email, password, nombre, role });
    persistAuth(data);
    return data;
  },

  registerTenant: async (payload) => {
    const { data } = await api.post('/api/auth/tenant-register', payload);
    persistAuth(data);
    return data;
  },

  logout: () => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken || tokenStore.getAccessToken() || localStorage.getItem('user')) {
      api.post('/api/auth/logout', refreshToken ? { refreshToken } : {})
        .catch(() => console.warn('No se pudo revocar la sesión en el servidor.'));
    }
    tokenStore.clear();
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  },

  restoreSession: async () => {
    try {
      const { data } = await refreshRequest();
      persistAuth(data);
      return data.user;
    } catch {
      tokenStore.clear();
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      return null;
    }
  },

  refreshSession: async () => {
    const { data } = await refreshRequest();
    persistAuth(data);
    return data;
  },

  getCurrentUser: () => {
    try {
      const user = localStorage.getItem('user');
      if (!user || user === 'undefined' || user === 'null') return null;
      return JSON.parse(user);
    } catch {
      localStorage.removeItem('user');
      return null;
    }
  },

  isAuthenticated: () => {
    return !!tokenStore.getAccessToken();
  },
};
