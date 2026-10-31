import api from './axios.js';

export const timeApi = {
  list: (params) => api.get('/time-entries', { params }),
  create: (data) => api.post('/time-entries', data),
  update: (id, data) => api.patch(`/time-entries/${id}`, data),
  delete: (id) => api.delete(`/time-entries/${id}`),
  activeTimer: () => api.get('/time-entries/active'),
  startTimer: (data) => api.post('/time-entries/start', data),
  stopTimer: (id) => api.post(id ? `/time-entries/${id}/stop` : '/time-entries/stop'),
};
