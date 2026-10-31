import api from './axios.js';

export const portalApi = {
  login: (token) => api.post('/portal/session', { token }),
  me: () => api.get('/portal/me'),
  logout: () => api.post('/portal/logout'),
  getProjects: () => api.get('/portal/projects'),
  getProject: (id) => api.get(`/portal/projects/${id}`),
  getMessages: (projectId, params) => api.get(`/portal/projects/${projectId}/messages`, { params }),
  sendMessage: (projectId, data) => api.post(`/portal/projects/${projectId}/messages`, data),
  getInvoices: () => api.get('/portal/invoices'),
  getInvoice: (id) => api.get(`/portal/invoices/${id}`),
  invoicePdf: (id) => api.get(`/portal/invoices/${id}/pdf`, { responseType: 'blob' }),
};
