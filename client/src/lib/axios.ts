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

api.interceptors.request.use((config) => {
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }

  if (typeof window !== 'undefined') {
    const userId = localStorage.getItem('trueclaim_user_id');
    if (userId) {
      config.headers['x-user-id'] = userId;
    }
  }

  return config;
});

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

const SERVER_ORIGIN = configuredBaseUrl.replace(/\/api\/?$/, '');

/** Resolve a server-relative image path (e.g. /uploads/x.jpg) to a full URL. */
export function resolveImageUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `${SERVER_ORIGIN}${path}`;
}

export default api;
