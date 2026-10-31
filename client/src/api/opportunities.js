import api from './axios.js';

export const opportunitiesApi = {
  list: (params) => api.get('/opportunities', { params }),
  my: () => api.get('/opportunities/my'),
  create: (data) => api.post('/opportunities', data),
  apply: (id, data) => api.post(`/opportunities/${id}/apply`, data),
  delete: (id) => api.delete(`/opportunities/${id}`),
};
