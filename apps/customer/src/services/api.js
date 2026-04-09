import axios from 'axios';
import useAuthStore from '../store/authStore';

const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000',
});

api.interceptors.request.use(cfg => {
  const token = useAuthStore.getState().token;
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

api.interceptors.response.use(r => r, err => {
  if (err.response?.status === 401) useAuthStore.getState().logout();
  return Promise.reject(err);
});

export default api;
