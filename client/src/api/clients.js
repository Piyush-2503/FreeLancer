import api from './axios.js';

export const clientsApi = {
  list: (params) => api.get('/clients', { params }),
  create: (data) => api.post('/clients', data),
  get: (id) => api.get(`/clients/${id}`),
  update: (id, data) => api.patch(`/clients/${id}`, data),
  delete: (id) => api.delete(`/clients/${id}`),
  archive: (id) => api.patch(`/clients/${id}/archive`),
  unarchive: (id) => api.patch(`/clients/${id}/unarchive`),
  generatePortalLink: (id) => api.post(`/clients/${id}/portal-link`),
  revokePortalLink: (id) => api.delete(`/clients/${id}/portal-link`),
};
