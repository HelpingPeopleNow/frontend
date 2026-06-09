/**
 * Auth helpers — magic link only.
 * Direct fetch against the Better Auth API.
 */

const AUTH_BASE = '/api/auth';

export interface Session {
  user: { id: string; email: string; name?: string; role?: string };
  session: { id: string; token: string; expiresAt: Date };
}

export async function getSession(): Promise<Session | null> {
  try {
    const res = await fetch(`${AUTH_BASE}/get-session`, {
      credentials: 'include',
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.session ? data : null;
  } catch {
    return null;
  }
}

export async function sendMagicLink(
  email: string,
  name?: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const res = await fetch(`${AUTH_BASE}/sign-in/magic-link`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, name, callbackURL: '/' }),
      credentials: 'include',
    });
    const data = await res.json();
    if (!res.ok) return { ok: false, error: data?.error?.message || data?.message || 'Failed to send link' };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: 'Network error — check your connection' };
  }
}

export async function logout(): Promise<void> {
  try {
    await fetch(`${AUTH_BASE}/sign-out`, {
      method: 'POST',
      credentials: 'include',
    });
  } catch {
    // Best-effort
  }
}
