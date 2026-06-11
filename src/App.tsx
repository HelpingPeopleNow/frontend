import { h } from 'preact';
import { Router, Route, route } from 'preact-router';
import { useEffect } from 'preact/hooks';
import { AuthProvider, useAuth } from './AuthProvider';
import { useLanguage, LangToggle } from './i18n';
import ChatPage from './ChatPage';
import AdminPage from './AdminPage';
import LoginPage from './LoginPage';
import SignupPage from './SignupPage';
import WorkerPage from './WorkerPage';
import ClientPage from './ClientPage';

function ProtectedRoute({ component: Component, ...props }: any) {
  const { session, loading } = useAuth();
  useEffect(() => {
    if (!loading && !session) {
      console.log('[Nav] unauthorized, redirecting to /login');
      route('/login', true);
    }
  }, [loading, session]);
  if (loading) return <div class="loading-auth">Checking authentication...</div>;
  if (!session) return null;
  return <Component {...props} />;
}

function AppRouter() {
  const { loading } = useAuth();
  const { t } = useLanguage();

  const handleRoute = (e: any) => {
    const path = e?.url || '/';
    console.log('[Nav] route:', path);
  };

  if (loading) {
    return <div class="loading">{t('auth.checking')}</div>;
  }

  return (
    <div id="app">
      <Router onChange={handleRoute}>
        <Route path="/login" component={LoginPage} onNavigate={(p: string) => route(p)} />
        <Route path="/signup" component={SignupPage} onNavigate={(p: string) => route(p)} />
        <Route path="/admin" component={() => <ProtectedRoute component={AdminPage} />} />
        <Route path="/worker" component={() => <ProtectedRoute component={WorkerPage} />} />
        <Route path="/client" component={() => <ProtectedRoute component={ClientPage} />} />
        <Route path="/" component={() => <ProtectedRoute component={ChatPage} />} />
      </Router>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  );
}
