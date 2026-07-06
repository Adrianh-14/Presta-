import api from './api';

export const prestamoService = {
  getAll: async (search = '', estado = '', tipo = '') => {
    const params = {};
    if (search) params.search = search;
    if (estado) params.estado = estado;
    if (tipo) params.tipo = tipo;
    const { data } = await api.get('/api/prestamos', { params });
    return data;
  },

  getById: async (id) => {
    const { data } = await api.get(`/api/prestamos/${id}`);
    return data;
  },

  updateEstado: async (id, estado) => {
    const { data } = await api.patch(`/api/prestamos/${id}/estado`, JSON.stringify(estado), {
      headers: { 'Content-Type': 'application/json' },
    });
    return data;
  },

  createDirect: async (loanData) => {
    const { data } = await api.post('/api/prestamos/direct', loanData);
    return data;
  },
};
