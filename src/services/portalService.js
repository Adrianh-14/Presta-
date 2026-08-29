import api from './api';

export const portalService = {
  requestOtp: async (tenant, cedula) => {
    const { data } = await api.post('/api/auth/client-otp/request', { tenant, cedula });
    return data;
  },
  verifyOtp: async (challengeId, tenant, cedula, code) => {
    const { data } = await api.post('/api/auth/client-otp/verify', {
      challengeId,
      tenant,
      cedula,
      code,
    });
    return data;
  },
  revokeSession: async () => api.post(
    '/api/auth/client-session/revoke',
    undefined,
    { useClientToken: true }),
  getMe: async () => {
    const { data } = await api.get('/api/clients/me', { useClientToken: true });
    return data;
  },
  getMyLoans: async () => {
    const { data } = await api.get('/api/clients/me/loans', { useClientToken: true });
    return data;
  },
  getMyApplications: async () => {
    const { data } = await api.get('/api/clients/me/solicitudes', { useClientToken: true });
    return data;
  },
  uploadGuarantee: async (id, image) => {
    const { data } = await api.post(`/api/clients/me/solicitudes/${id}/garantia`, { image }, { useClientToken: true, timeout: 120000 });
    return data;
  },
  getLoan: async (loanId) => {
    const { data } = await api.get(`/api/prestamos/${loanId}`, { useClientToken: true });
    return data;
  },
  getAmortization: async (loanId) => {
    const { data } = await api.get(`/api/prestamos/${loanId}/amortization`, { useClientToken: true });
    return data;
  },
  getPayments: async (loanId) => {
    const { data } = await api.get(`/api/payments/loan/${loanId}`, { useClientToken: true });
    return data;
  },
  getPaymentSummary: async (loanId) => {
    const { data } = await api.get(`/api/payments/loan/${loanId}/summary`, { useClientToken: true });
    return data;
  },
  getQRInfo: async (token) => {
    const { data } = await api.get(`/api/portal/pago-qr/${token}`);
    return data;
  },
  processQRPayment: async (token, latitud, longitud) => {
    const { data } = await api.post('/api/portal/pago-qr/process', { token, latitud, longitud });
    return data;
  },

  requestQRPaymentOtp: async (token, cedula) => {
    const { data } = await api.post('/api/portal/pago-qr/request-otp', { token, cedula });
    return data;
  },

  verifyQRPaymentOtp: async (token, cedula, challengeId, code, latitud, longitud) => {
    const { data } = await api.post('/api/portal/pago-qr/verify-otp', { token, cedula, challengeId, code, latitud, longitud });
    return data;
  },
};
