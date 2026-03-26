// ─── Auth Abstraction Layer ──────────────────────────────────────────────────
// This is the SINGLE place that determines "who is the current user".
//
// RIGHT NOW:  Uses a random ID stored in localStorage (no login required).
// FUTURE:     Replace the body of getCurrentUserId() with your real auth
//             logic (e.g. decode JWT, read session cookie, call /api/auth/me).
//             Every other file imports this function — nothing else changes.

const STORAGE_KEY = 'trueclaim_user_id';

/**
 * Returns the current user's unique identifier.
 * Creates and persists a temporary one if none exists yet.
 */
export function getCurrentUserId(): string {
  // FUTURE UPGRADE: Replace this block with real auth, e.g.:
  // return getSessionUser().id;

  if (typeof window === 'undefined') return '';

  let userId = localStorage.getItem(STORAGE_KEY);
  if (!userId) {
    userId = `user_${crypto.randomUUID().slice(0, 8)}`;
    localStorage.setItem(STORAGE_KEY, userId);
  }
  return userId;
}

/**
 * Returns a display name for the current user.
 * FUTURE UPGRADE: Return the real user's name from auth context.
 */
export function getCurrentUserName(): string {
  return 'You';
}
