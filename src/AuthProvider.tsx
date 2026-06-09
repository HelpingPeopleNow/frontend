import { h, createContext } from 'preact';
import { useState, useEffect, useContext } from 'preact/hooks';
import { getSession, sendMagicLink, logout, Session } from './auth';

export interface AuthContextValue {
  session: Session | null;
  loading: boolean;
  sendMagicLink: typeof sendMagicLink;
  logout: () => Promise<void>;
  refreshSession: () => Promise<Session | null>;
}

const AuthCtx = createContext<AuthContextValue>({
  session: null,
  loading: true,
  sendMagicLink,
  logout,
  refreshSession: async () => null,
});

export function AuthProvider({ children }: { children: h.JSX.Element }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // On mount and after magic link redirect, check session
  useEffect(() => {
    getSession().then((s) => {
      console.log('[Auth] session check:', s ? `user=${s.user.email}` : 'none');
      setSession(s);
      setLoading(false);
    });
  }, []);

  const logoutFn = async () => {
    await logout();
    setSession(null);
  };

  const sendMagicLinkFn = async (email: string, name?: string) => {
    const result = await sendMagicLink(email, name);
    return result;
  };

  const refreshSessionFn = async () => {
    const s = await getSession();
    setSession(s);
    return s;
  };

  return (
    <AuthCtx.Provider value={{ session, loading, sendMagicLink: sendMagicLinkFn, logout: logoutFn, refreshSession: refreshSessionFn }}>
      {children}
    </AuthCtx.Provider>
  );
}

export function useAuth() {
  return useContext(AuthCtx);
}
