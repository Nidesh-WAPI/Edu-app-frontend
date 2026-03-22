import axios from 'axios';
import { store } from '../store/store';
import { logout } from '../store/authSlice';

const axiosInstance = axios.create({
  // In production the env var is baked in by Vite at build time.
  // In development Vite proxies /api → localhost:5001 so the relative path works.
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api/v1',
  headers: { 'Content-Type': 'application/json' },
});

axiosInstance.interceptors.request.use((config) => {
  const token = store.getState().auth.token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

axiosInstance.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) store.dispatch(logout());
    return Promise.reject(err);
  }
);

export default axiosInstance;
