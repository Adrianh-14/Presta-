import api from './api';

export const solicitudService = {
  getAll: async () => {
    const { data } = await api.get('/api/solicituds');
    return data;
  },

  getById: async (id) => {
    const { data } = await api.get(`/api/solicituds/${id}`);
    return data;
  },

  create: async (solicitudData) => {
    const { data } = await api.post('/api/solicituds', solicitudData, { timeout: 120000 });
    return data;
  },

  updateEstado: async (id, estado, options = {}) => {
    const { data } = await api.patch(`/api/solicituds/${id}/estado`, { estado, ...options }, {
      headers: { 'Content-Type': 'application/json' },
    });
    return data;
  },
  getDecision: async (id, token) => {
    const { data } = await api.get(`/api/solicituds/decision/${id}`, { params: { token } });
    return data;
  },
  decideAsClient: async (id, token, approved) => {
    const { data } = await api.post(`/api/solicituds/decision/${id}`, { token, approved });
    return data;
  },
  resendCounterOffer: async (id, terms = {}) => {
    const { data } = await api.post(`/api/solicituds/${id}/reenviar-contraoferta`, terms);
    return data;
  },
};
