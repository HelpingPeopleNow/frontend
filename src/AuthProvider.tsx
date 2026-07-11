import { h, createContext } from 'preact';
import { useState, useEffect, useContext } from 'preact/hooks';
import { log, logError } from './lib/logger';
import { getSession, sendMagicLink, logout, Session } from './auth';
import { useLanguage } from './i18n';

export interface AuthContextValue {
  session: Session | null;
  loading: boolean;
  error: boolean;
  sendMagicLink: (email: string, capToken: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<Session | null>;
}

const AuthCtx = createContext<AuthContextValue>({
  session: null,
  loading: true,
  error: false,
  sendMagicLink: async (email: string, capToken: string) => sendMagicLink(email, capToken),
  logout,
  refreshSession: async () => null,
});

export function AuthProvider({ children }: { children: h.JSX.Element }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const { lang } = useLanguage();

  useEffect(() => {
    log('auth', 'checking session on mount');
    setError(false);
    getSession().then((s) => {
      log('auth', `session ${s ? 'found' : 'not found'}${s ? ' user=' + s.user.id : ''}`);
      setSession(s);
      setLoading(false);
    }).catch((e) => {
      logError('auth', `session check failed: ${e instanceof Error ? e.message : String(e)}`);
      setError(true);
      setLoading(false);
    });
  }, []);

  const logoutFn = async () => {
    log('auth', 'logout initiated');
    await logout();
    setSession(null);
    setError(false);
  };

  const sendMagicLinkFn = async (email: string, capToken: string) => {
    const result = await sendMagicLink(email, capToken, lang);
    return result;
  };

  const refreshSessionFn = async () => {
    log('auth', 'refreshing session');
    setError(false);
    try {
      const s = await getSession();
      setSession(s);
      return s;
    } catch (e) {
      logError('auth', `refresh failed: ${e instanceof Error ? e.message : String(e)}`);
      setError(true);
      return null;
    }
  };

  return (
    <AuthCtx.Provider value={{ session, loading, error, sendMagicLink: sendMagicLinkFn, logout: logoutFn, refreshSession: refreshSessionFn }}>
      {children}
    </AuthCtx.Provider>
  );
}

export function useAuth() {
  return useContext(AuthCtx);
}
