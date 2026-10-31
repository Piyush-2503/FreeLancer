import axios from 'axios';

const api = axios.create({
  baseURL: '/api/v1',
  withCredentials: true,
  headers: { 'X-Requested-With': 'XMLHttpRequest' },
});

// Request interceptor: attach auth tokens from localStorage
api.interceptors.request.use((config) => {
  const url = config.url || '';
  if (url.startsWith('/portal')) {
    const portalToken = localStorage.getItem('fh_portal_token');
    if (portalToken && !config.headers['Authorization']) {
      config.headers['Authorization'] = `Bearer ${portalToken}`;
    }
  } else {
    const token = localStorage.getItem('fh_token');
    if (token && !config.headers['Authorization']) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
  }
  return config;
});

// Response interceptor: handle 401 gracefully
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      const url = err.config?.url || '';
      const isSessionCheck = url.includes('/auth/me') || url.includes('/portal/me');
      
      // If unauthorized on protected dashboard route, clear token and redirect to login
      if (!isSessionCheck && window.location.pathname.startsWith('/dashboard')) {
        localStorage.removeItem('fh_token');
        delete api.defaults.headers.common['Authorization'];
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

export default api;
