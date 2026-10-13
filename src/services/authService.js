import api from './api';

export const authService = {
  login: async (email, password) => {
    const { data } = await api.post('/api/auth/login', { email, password });
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    localStorage.setItem('user', JSON.stringify(data.user));
    return data;
  },
  requestPasswordReset: async (email) => (await api.post('/api/auth/password-reset/request', { email })).data,
  confirmPasswordReset: async (token, newPassword) => (await api.post('/api/auth/password-reset/confirm', { token, newPassword })).data,
  requestEmailVerification: async (email, purpose) => (await api.post('/api/auth/email-verification/request', { email, purpose })).data,
  confirmEmailVerification: async (email, purpose, code) => (await api.post('/api/auth/email-verification/confirm', { email, purpose, code })).data,

  register: async (email, password, nombre, role = 'Client') => {
    const { data } = await api.post('/api/auth/register', { email, password, nombre, role });
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    localStorage.setItem('user', JSON.stringify(data.user));
    return data;
  },

  registerTenant: async (payload) => {
    const { data } = await api.post('/api/auth/tenant-register', payload);
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    localStorage.setItem('user', JSON.stringify(data.user));
    return data;
  },

  logout: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  },

  restoreSession: async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    const storedUser = authService.getCurrentUser();
    if (!refreshToken) return storedUser && localStorage.getItem('accessToken') ? storedUser : null;
    try {
      const { data } = await api.post('/api/auth/refresh', { refreshToken });
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      localStorage.setItem('user', JSON.stringify(data.user));
      return data.user;
    } catch {
      authService.logout();
      return null;
    }
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
    return !!localStorage.getItem('accessToken');
  },
};
