import { h } from 'preact';
import { Router, Route, route } from 'preact-router';
import { useEffect } from 'preact/hooks';
import { AuthProvider, useAuth } from './AuthProvider';
import { useLanguage } from './i18n';
import LandingPage from './LandingPage';
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
      route('/login', true);
    }
  }, [loading, session]);
  if (loading) return <div class="loading"><div class="spinner" /></div>;
  if (!session) return null;
  return <Component {...props} />;
}

function AppRouter() {
  const { loading } = useAuth();
  const { t } = useLanguage();

  if (loading) {
    return <div class="loading"><div class="spinner" /></div>;
  }

  return (
    <Router>
      <Route path="/" component={LandingPage} />
      <Route path="/login" component={LoginPage} onNavigate={(p: string) => route(p)} />
      <Route path="/signup" component={SignupPage} onNavigate={(p: string) => route(p)} />
      <Route path="/chat" component={() => <ProtectedRoute component={ChatPage} />} />
      <Route path="/admin" component={() => <ProtectedRoute component={AdminPage} />} />
      <Route path="/worker" component={() => <ProtectedRoute component={WorkerPage} />} />
      <Route path="/client" component={() => <ProtectedRoute component={ClientPage} />} />
    </Router>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  );
}
