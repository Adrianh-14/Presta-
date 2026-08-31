import api from './api';

export const cobradorService = {
  getAll: async () => {
    const { data } = await api.get('/api/cobradores');
    return data;
  },

  create: async (collectorData) => {
    const { data } = await api.post('/api/cobradores', collectorData);
    return data;
  },

  assignLoans: async (collectorId, loanIds) => {
    const { data } = await api.post(`/api/cobradores/${collectorId}/assign`, { loanIds });
    return data;
  },

  toggleStatus: async (collectorId, isActive) => {
    const { data } = await api.patch(`/api/cobradores/${collectorId}/status`, { isActive });
    return data;
  },

  removeAssignment: async (assignmentId) => {
    await api.delete(`/api/cobradores/assignments/${assignmentId}`);
  },
};

export const collectorPortalService = {
  getDashboard: async () => {
    const { data } = await api.get('/api/collector/dashboard');
    return data;
  },

  getCollections: async () => {
    const { data } = await api.get('/api/collector/collections');
    return data;
  },

  recordVisit: async (assignmentId, visitData) => {
    const { data } = await api.post(`/api/collector/collections/${assignmentId}/visit`, visitData);
    return data;
  },

  generateQR: async (assignmentId, monto) => {
    const { data } = await api.post('/api/collector/generate-qr', { assignmentId, monto });
    return data;
  },

  toggleQRAuthorization: async (assignmentId, isQRAuthorized) => {
    const { data } = await api.patch(`/api/cobradores/assignments/${assignmentId}/qr-authorization`, { isQRAuthorized });
    return data;
  },

  getAssignments: async (collectorId) => {
    const { data } = await api.get(`/api/cobradores/${collectorId}/assignments`);
    return data;
  },

  getSuggestedAmount: async (assignmentId) => {
    const { data } = await api.get(`/api/collector/assignments/${assignmentId}/suggested-amount`);
    return data;
  },
};
