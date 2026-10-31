import api from './axios.js';

export const messagesApi = {
  list: (projectId, params) => api.get(`/projects/${projectId}/messages`, { params }),
  send: (projectId, data) => api.post(`/projects/${projectId}/messages`, data),
};
