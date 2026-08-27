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
};
