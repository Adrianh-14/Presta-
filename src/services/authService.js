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
