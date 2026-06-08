/**
 * Auth helpers — login, signup, logout, session check.
 * Direct fetch against the Better Auth API (no client SDK needed for Preact).
 */

const AUTH_BASE = '/api/auth';

export interface Session {
  user: { id: string; email: string; name?: string };
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

export async function login(email: string, password: string): Promise<{ ok: true; session: Session } | { ok: false; error: string }> {
  try {
    const res = await fetch(`${AUTH_BASE}/sign-in/email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
      credentials: 'include',
    });
    const data = await res.json();
    if (!res.ok) return { ok: false, error: data?.error?.message || data?.message || 'Login failed' };
    return { ok: true, session: data };
  } catch (e) {
    return { ok: false, error: 'Network error — check your connection' };
  }
}

export async function signup(name: string, email: string, password: string): Promise<{ ok: true; session: Session } | { ok: false; error: string }> {
  try {
    const res = await fetch(`${AUTH_BASE}/sign-up/email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
      credentials: 'include',
    });
    const data = await res.json();
    if (!res.ok) return { ok: false, error: data?.error?.message || data?.message || 'Signup failed' };
    return { ok: true, session: data };
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
