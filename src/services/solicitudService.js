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
    const { data } = await api.post('/api/solicituds', solicitudData);
    return data;
  },

  updateEstado: async (id, estado, fechaInicio = null) => {
    const { data } = await api.patch(`/api/solicituds/${id}/estado`, JSON.stringify({ estado, fechaInicio }), {
      headers: { 'Content-Type': 'application/json' },
    });
    return data;
  },
};
