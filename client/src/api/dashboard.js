import api from './axios.js';

export const dashboardApi = {
  getSummary: () => api.get('/dashboard/summary'),
};
