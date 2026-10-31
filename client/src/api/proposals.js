import api from './axios.js';

export const proposalsApi = {
  list: (params) => api.get('/proposals', { params }),
  create: (data) => api.post('/proposals', data),
  get: (id) => api.get(`/proposals/${id}`),
  update: (id, data) => api.patch(`/proposals/${id}`, data),
  send: (id) => api.post(`/proposals/${id}/send`),
  delete: (id) => api.delete(`/proposals/${id}`),
  // Public (no auth)
  getPublic: (token) => api.get(`/public/proposals/${token}`),
  accept: (token) => api.post(`/public/proposals/${token}/accept`),
  reject: (token) => api.post(`/public/proposals/${token}/reject`),
};
