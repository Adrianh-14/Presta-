import api from './api';

export const dashboardService = {
  getStats: async () => {
    const { data } = await api.get('/api/dashboard/stats');
    return data;
  },

  getLoansByMonth: async () => {
    const { data } = await api.get('/api/dashboard/loans-by-month');
    return data;
  },

  getLoansByType: async () => {
    const { data } = await api.get('/api/dashboard/loans-by-type');
    return data;
  },
};
