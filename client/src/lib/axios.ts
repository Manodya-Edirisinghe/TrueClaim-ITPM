import axios from 'axios';

// ─── Axios Instance ───────────────────────────────────────────────────────────
// Preconfigured Axios client pointing at the TrueClaim Express API.
// Usage: import api from '@/lib/axios'; then api.get('/items')

function getApiBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, '');
  }

  // In browser dev, route through Next.js rewrite to avoid CORS and port drift.
  if (typeof window !== 'undefined') {
    return '/server-api';
  }

  return 'http://localhost:5000/api';
}

const api = axios.create({
  baseURL: getApiBaseUrl(),
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor – set correct content type and attach auth token
api.interceptors.request.use((config) => {
  // Let the browser set the Content-Type (with boundary) for FormData
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }

  // Attach user identity header for messaging.
  // FUTURE UPGRADE: Replace with JWT from auth context:
  // const token = localStorage.getItem('token');
  // if (token) config.headers.Authorization = `Bearer ${token}`;
  if (typeof window !== 'undefined') {
    const userId = localStorage.getItem('trueclaim_user_id');
    if (userId) {
      config.headers['x-user-id'] = userId;
    }
  }
  return config;
});

// Response interceptor – centralised error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.response) {
      console.warn('[API Error] Network request failed. Check API server availability and NEXT_PUBLIC_API_URL.');
    } else {
      const status = Number(error.response.status ?? 0);
      const data = error.response.data;
      const hasUsefulBody =
        typeof data === 'string'
          ? data.trim().length > 0
          : data && (Array.isArray(data) ? data.length > 0 : Object.keys(data).length > 0);
      const payload = hasUsefulBody ? data : error.message;

      // 4xx responses are often expected (e.g., invalid credentials).
      if (status >= 400 && status < 500) {
        console.warn('[API Client Error]', payload);
      } else {
        // In the browser, avoid console.error to prevent Next.js console error overlay
        // for handled API failures. Keep hard errors on the server side.
        if (typeof window !== 'undefined') {
          console.warn('[API Server Error]', payload);
        } else {
          console.error('[API Server Error]', payload);
        }
      }
    }
    return Promise.reject(error);
  }
);

const API_BASE = getApiBaseUrl();
const SERVER_ORIGIN = 'http://localhost:5000';

/** Resolve a server-relative image path (e.g. /uploads/x.jpg) to a full URL. */
export function resolveImageUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${SERVER_ORIGIN}${normalizedPath}`;
}

export default api;
