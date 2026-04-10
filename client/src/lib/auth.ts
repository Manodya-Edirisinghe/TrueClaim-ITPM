// ─── Auth Abstraction Layer ──────────────────────────────────────────────────
// This is the SINGLE place that determines "who is the current user".
import api from '@/lib/axios';

const STORAGE_KEY = 'trueclaim_user_id';
const TOKEN_KEY = 'token';

type AuthMeResponse = {
  user?: {
    _id: string;
    fullName?: string;
  };
};

/**
 * Returns the current user's unique identifier.
 * Creates and persists a temporary one if none exists yet.
 */
export function getCurrentUserId(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem(STORAGE_KEY) ?? '';
}

/**
 * Returns a display name for the current user.
 * FUTURE UPGRADE: Return the real user's name from auth context.
 */
export function getCurrentUserName(): string {
  return 'You';
}

/**
 * Restores current user identity from JWT on page refresh.
 */
export async function restoreUserSession(): Promise<void> {
  if (typeof window === 'undefined') return;

  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) return;

  try {
    const { data } = await api.get<AuthMeResponse>('/auth/me');
    const userId = data?.user?._id;

    if (userId) {
      localStorage.setItem(STORAGE_KEY, userId);
      return;
    }

    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Invalid/expired token: clear persisted auth state.
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(STORAGE_KEY);
  }
}
