import api from './api';

export const platformService = {
  getOverview: async () => {
    const { data } = await api.get('/api/platform/overview');
    return data;
  },
  getTenants: async () => (await api.get('/api/platform/tenants')).data,
  updateTenantStatus: async (id, isActive) => (await api.put(`/api/platform/tenants/${id}/status`, { isActive })).data,
  bulkTenants: async (payload) => (await api.post('/api/platform/tenants/bulk', payload)).data,
  updateSubscription: async (id, payload) => (await api.put(`/api/platform/tenants/${id}/subscription`, payload)).data,
  getPlans: async () => (await api.get('/api/platform/plans')).data,
  updatePlan: async (id, payload) => (await api.put(`/api/platform/plans/${id}`, payload)).data,
  getAudit: async () => (await api.get('/api/platform/audit')).data,
  getFinancials: async () => (await api.get('/api/platform/financials')).data,
  getPromotion: async () => (await api.get('/api/platform/promotion')).data,
  updatePromotion: async (payload) => (await api.put('/api/platform/promotion', payload)).data,
  updateGrace: async (id, diasGracia) => (await api.put(`/api/platform/tenants/${id}/grace`, { diasGracia })).data,
};
