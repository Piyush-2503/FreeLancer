import api from './axios.js';

export const contractsApi = {
  list: (params) => api.get('/contracts', { params }),
  create: (data) => api.post('/contracts', data),
  get: (id) => api.get(`/contracts/${id}`),
  send: (id) => api.post(`/contracts/${id}/send`),
  delete: (id) => api.delete(`/contracts/${id}`),
  // Public (no auth)
  getPublic: (token) => api.get(`/public/contracts/${token}`),
  sign: (token, data) => api.post(`/public/contracts/${token}/sign`, data),
  reject: (token) => api.post(`/public/contracts/${token}/reject`),
};
