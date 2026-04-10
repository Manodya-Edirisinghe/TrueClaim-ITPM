import axios from 'axios';
import type { AxiosRequestConfig } from 'axios';

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

function getDirectApiBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, '');
  }

  if (typeof window !== 'undefined') {
    const host = window.location.hostname || 'localhost';
    return `http://${host}:5000/api`;
  }

  return 'http://localhost:5000/api';
}

type RetryableAxiosRequestConfig = AxiosRequestConfig & {
  __isDirectApiRetry?: boolean;
};

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

  // Attach JWT token for authenticated requests.
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      delete config.headers.Authorization;
    }
  }
  return config;
});

// Response interceptor – centralised error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const config = (error?.config ?? {}) as RetryableAxiosRequestConfig;

    if (
      typeof window !== 'undefined' &&
      !error?.response &&
      !config.__isDirectApiRetry &&
      typeof config.url === 'string' &&
      !/^https?:\/\//i.test(config.url)
    ) {
      return api.request({
        ...config,
        __isDirectApiRetry: true,
        baseURL: getDirectApiBaseUrl(),
      });
    }

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
const SERVER_ORIGIN =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/?$/, '') ?? 'http://localhost:5000';

/** Resolve an image URL to a browser-loadable absolute URL. */
export function resolveImageUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;

  if (path.startsWith('//')) {
    return `https:${path}`;
  }

  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${SERVER_ORIGIN}${normalizedPath}`;
}

export default api;
