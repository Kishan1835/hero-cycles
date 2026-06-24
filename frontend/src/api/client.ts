import axios, { AxiosError } from 'axios';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? '/api';

export const apiClient = axios.create({
  baseURL: apiBaseUrl,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('hc_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ error: { message: string; code: string } }>) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('hc_token');
      localStorage.removeItem('hc_user');
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
    }
    const message = error.response?.data?.error?.message ?? error.message ?? 'Something went wrong';
    return Promise.reject(new Error(message));
  }
);
