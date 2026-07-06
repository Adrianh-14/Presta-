import api from './api';

export const clientService = {
  getAll: async (search = '', estado = '') => {
    const params = {};
    if (search) params.search = search;
    if (estado) params.estado = estado;
    const { data } = await api.get('/api/clients', { params });
    return data;
  },

  getById: async (id) => {
    const { data } = await api.get(`/api/clients/${id}`);
    return data;
  },

  update: async (id, clientData) => {
    const { data } = await api.put(`/api/clients/${id}`, clientData);
    return data;
  },

  register: async (clientData) => {
    const { data } = await api.post('/api/clients/register', clientData);
    return data;
  },
};
