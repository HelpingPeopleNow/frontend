import { request } from './api';

export interface Session {
  user: {
    id: string;
    email: string;
    name?: string;
  };
  token: string;
}

interface SessionResponse {
  session: { token: string; user: Session['user'] } | null;
  user: Session['user'] | null;
}

export async function getSession(): Promise<Session | null> {
  try {
    const data = await request<SessionResponse>('/api/auth/get-session');
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

export async function sendMagicLink(email: string, lang: string = 'es'): Promise<{ ok: boolean; error?: string }> {
  try {
    await request('/api/auth/sign-in/magic-link', {
      method: 'POST',
      body: JSON.stringify({
        email,
        callbackURL: '/',
        metadata: { lang },
      }),
    });
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

export async function logout(): Promise<void> {
  try {
    await request('/api/auth/sign-out', {
      method: 'POST',
      body: '{}',
    });
  } catch {
    // Best-effort
  }
}
