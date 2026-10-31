import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../api/auth.js';
import api from '../api/axios.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchMe = useCallback(async () => {
    try {
      const savedToken = localStorage.getItem('fh_token');
      if (savedToken) {
        api.defaults.headers.common['Authorization'] = `Bearer ${savedToken}`;
      }
      const res = await authApi.getMe();
      const userData = res.data?.data?.user || res.data?.user;
      setUser(userData);
    } catch {
      localStorage.removeItem('fh_token');
      delete api.defaults.headers.common['Authorization'];
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  const login = async (credentials) => {
    const res = await authApi.login(credentials);
    const data = res.data?.data || {};
    const userData = data.user || res.data?.user;
    const token = data.token || res.data?.token;
    if (token) {
      localStorage.setItem('fh_token', token);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
    setUser(userData);
    return userData;
  };

  const register = async (data) => {
    const res = await authApi.register(data);
    const resData = res.data?.data || {};
    const userData = resData.user || res.data?.user;
    const token = resData.token || res.data?.token;
    if (token) {
      localStorage.setItem('fh_token', token);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
    setUser(userData);
    return userData;
  };

  const logout = async () => {
    localStorage.removeItem('fh_token');
    delete api.defaults.headers.common['Authorization'];
    try {
      await authApi.logout();
    } catch {}
    setUser(null);
  };

  const updateUser = async (data) => {
    const res = await authApi.updateMe(data);
    const updated = res.data?.data?.user || res.data?.user;
    setUser(updated);
    return updated;
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
