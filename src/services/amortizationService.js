import api from './api';

export const amortizationService = {
  getByLoanId: async (loanId) => {
    const { data } = await api.get(`/api/prestamos/${loanId}/amortization`);
    return data;
  },
};
