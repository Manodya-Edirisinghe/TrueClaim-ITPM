import axios from 'axios';

// ─── Axios Instance ───────────────────────────────────────────────────────────
// Preconfigured Axios client pointing at the TrueClaim Express API.
// Usage: import api from '@/lib/axios'; then api.get('/items')

const configuredBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api';

const api = axios.create({
  baseURL: configuredBaseUrl,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

const fallbackBaseUrls = Array.from(
  new Set([configuredBaseUrl, 'http://localhost:8000/api', 'http://localhost:5000/api', 'http://localhost:5001/api'])
);

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
  async (error) => {
    const requestConfig = error.config as
      | (typeof error.config & {
          __tcRetried?: boolean;
          baseURL?: string;
        })
      | undefined;

    if (requestConfig && !error.response && !requestConfig.__tcRetried) {
      requestConfig.__tcRetried = true;
      const currentBaseUrl = requestConfig.baseURL ?? configuredBaseUrl;
      const nextBaseUrl = fallbackBaseUrls.find((url) => url !== currentBaseUrl);

      if (nextBaseUrl) {
        requestConfig.baseURL = nextBaseUrl;
        try {
          return await api.request(requestConfig);
        } catch {
          // Let the original error flow to caller after retry fails.
        }
      }
    }

    if (!error.response) {
      console.warn('[API Network Warning]', error.message);
    } else {
      console.error('[API Error]', error.response?.data ?? error.message);
    }

    return Promise.reject(error);
  }
);

export default api;
