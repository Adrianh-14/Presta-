import api from './api';

export const tenantService = {
  getCurrencies: async (tenantId = null) => {
    const url = tenantId ? `/api/tenant/public/${tenantId}/currencies` : '/api/dashboard/stats';
    const { data } = await api.get(url);
    return data.monedasHabilitadas || (data.monedasHabilitadasCsv || 'DOP').split(',').map((x) => x.trim()).filter(Boolean);
  },
};
