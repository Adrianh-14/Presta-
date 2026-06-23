import api from './api';

export const paymentService = {
  create: async (paymentData) => {
    const { data } = await api.post('/api/payments', paymentData);
    return data;
  },

  getByLoanId: async (loanId) => {
    const { data } = await api.get(`/api/payments/loan/${loanId}`);
    return data;
  },

  getSummary: async (loanId) => {
    const { data } = await api.get(`/api/payments/loan/${loanId}/summary`);
    return data;
  },

  createMora: async (moraData) => {
    const { data } = await api.post('/api/payments/mora', moraData);
    return data;
  },
};
