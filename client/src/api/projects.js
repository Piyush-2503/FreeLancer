import api from './axios.js';

export const projectsApi = {
  list: (params) => api.get('/projects', { params }),
  create: (data) => api.post('/projects', data),
  get: (id) => api.get(`/projects/${id}`),
  update: (id, data) => api.patch(`/projects/${id}`, data),
  delete: (id) => api.delete(`/projects/${id}`),
  // Tasks
  listTasks: (projectId) => api.get(`/projects/${projectId}/tasks`),
  createTask: (projectId, data) => api.post(`/projects/${projectId}/tasks`, data),
  // Messages
  getMessages: (projectId, params) => api.get(`/projects/${projectId}/messages`, { params }),
  sendMessage: (projectId, data) => api.post(`/projects/${projectId}/messages`, data),
};
