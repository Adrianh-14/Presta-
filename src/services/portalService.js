import api from './api';

export const portalService = {
  login: async (cedula) => {
    const { data } = await api.post('/api/auth/client-access', { cedula });
    return data;
  },
  getMe: async () => {
    const { data } = await api.get('/api/clients/me');
    return data;
  },
  getMyLoans: async () => {
    const { data } = await api.get('/api/clients/me/loans');
    return data;
  },
};
