import { log, logError } from '../lib/logger';
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
    if (!data || !data.session || !data.user) {
      log('auth', 'no active session');
      return null;
    }
    log('auth', `session found for user=${data.user.id} email=${data.user.email}`);
    return {
      user: {
        id: data.user.id,
        email: data.user.email,
        name: data.user.name,
      },
      token: data.session.token,
    };
  } catch (e) {
    logError('auth', `getSession failed: ${e instanceof Error ? e.message : String(e)}`);
    return null;
  }
}

export async function sendMagicLink(email: string, lang: string = 'es'): Promise<{ ok: boolean; error?: string }> {
  try {
    log('auth', `sending magic link to ${email} lang=${lang}`);
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
    logError('auth', `sendMagicLink failed: ${e instanceof Error ? e.message : String(e)}`);
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

export async function logout(): Promise<void> {
  try {
    log('auth', 'logging out');
    await request('/api/auth/sign-out', {
      method: 'POST',
      body: '{}',
    });
  } catch (e) {
    logError('auth', `logout failed (best-effort): ${e instanceof Error ? e.message : String(e)}`);
  }
}
