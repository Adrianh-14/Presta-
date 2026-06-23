import api from './api';

export const authService = {
  login: async (email, password) => {
    const { data } = await api.post('/api/auth/login', { email, password });
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    localStorage.setItem('user', JSON.stringify(data.user));
    return data;
  },

  register: async (email, password, nombre, role = 'Client') => {
    const { data } = await api.post('/api/auth/register', { email, password, nombre, role });
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
