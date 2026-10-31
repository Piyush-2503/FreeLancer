import api from './axios.js';

export const tasksApi = {
  update: (id, data) => api.patch(`/tasks/${id}`, data),
  delete: (id) => api.delete(`/tasks/${id}`),
  move: (id, data) => api.post(`/tasks/${id}/move`, data),
  startTimer: (id) => api.post(`/tasks/${id}/timer/start`),
  stopTimer: (id) => api.post(`/tasks/${id}/timer/stop`),
};
