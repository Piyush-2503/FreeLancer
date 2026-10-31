import api from './axios.js';

export const invoicesApi = {
  list: (params) => api.get('/invoices', { params }),
  create: (data) => api.post('/invoices', data),
  createFromTime: (data) => api.post('/invoices/from-time', data),
  get: (id) => api.get(`/invoices/${id}`),
  update: (id, data) => api.patch(`/invoices/${id}`, data),
  send: (id) => api.post(`/invoices/${id}/send`),
  cancel: (id) => api.post(`/invoices/${id}/cancel`),
  pdf: (id) => api.get(`/invoices/${id}/pdf`, { responseType: 'blob' }),
  paymentLink: (id) => api.post(`/invoices/${id}/payment-link`),
};
