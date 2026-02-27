import axios from 'axios';

// ─── Axios Instance ───────────────────────────────────────────────────────────
// Preconfigured Axios client pointing at the TrueClaim Express API.
// Usage: import api from '@/lib/axios'; then api.get('/items')

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor – attach auth token if present
api.interceptors.request.use((config) => {
  // TODO: attach JWT from localStorage / cookie
  // const token = localStorage.getItem('token');
  // if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Response interceptor – centralised error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('[API Error]', error.response?.data ?? error.message);
    return Promise.reject(error);
  }
);

export default api;
