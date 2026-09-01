import api from './api';

export const moraService = {
  getOverview: async () => {
    const { data } = await api.get('/api/mora/overview');
    return data;
  },
};
