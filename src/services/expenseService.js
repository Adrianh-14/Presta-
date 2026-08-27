import api from './api';

export const expenseService = {
  getAll: async (params = {}) => {
    const { data } = await api.get('/api/expenses', { params });
    return data;
  },

  getSummary: async () => {
    const { data } = await api.get('/api/expenses/summary');
    return data;
  },

  create: async (expenseData) => {
    const { data } = await api.post('/api/expenses', expenseData);
    return data;
  },

  update: async (id, expenseData) => {
    const { data } = await api.put(`/api/expenses/${id}`, expenseData);
    return data;
  },

  delete: async (id) => {
    await api.delete(`/api/expenses/${id}`);
  },
};
