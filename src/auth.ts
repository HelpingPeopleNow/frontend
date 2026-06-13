const API = '/api';

export interface Session {
  user: {
    id: string;
    email: string;
    name?: string;
  };
  token: string;
}

export async function getSession(): Promise<Session | null> {
  try {
    const res = await fetch(`${API}/auth/get-session`, {
      credentials: 'include',
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data || !data.session || !data.user) return null;
    return {
      user: {
        id: data.user.id,
        email: data.user.email,
        name: data.user.name,
      },
      token: data.session.token,
    };
  } catch {
    return null;
  }
}

export async function sendMagicLink(
  email: string,
  name?: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(`${API}/auth/sign-in/magic-link`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        email,
        name,
        callbackURL: '/',
      }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return {
        ok: false,
        error: data.message || data.error || `HTTP ${res.status}`,
      };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

export async function logout(): Promise<void> {
  try {
    await fetch(`${API}/auth/sign-out`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
      credentials: 'include',
    });
  } catch {
    // Best-effort
  }
}
