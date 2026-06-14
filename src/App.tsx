import { h } from 'preact';
import { Router, Route, route } from 'preact-router';
import { useEffect } from 'preact/hooks';
import { AuthProvider, useAuth } from './AuthProvider';
import LandingPage from './LandingPage';
import ChatPage from './ChatPage';
import FindPage from './FindPage';
import AdminPage from './AdminPage';
import AdminLLMPage from './AdminLLMPage';
import AdminPromptsPage from './AdminPromptsPage';
import LoginPage from './LoginPage';
import SignupPage from './SignupPage';

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

  if (loading) {
    return <div class="loading"><div class="spinner" /></div>;
  }

  return (
    <Router>
      <Route path="/" component={LandingPage} />
      <Route path="/login" component={LoginPage} onNavigate={(p: string) => route(p)} />
      <Route path="/signup" component={SignupPage} onNavigate={(p: string) => route(p)} />
      <Route path="/chat" component={() => <ProtectedRoute component={ChatPage} />} />
      <Route path="/find" component={() => <ProtectedRoute component={FindPage} />} />
      <Route path="/admin" component={() => <ProtectedRoute component={AdminPage} />} />
      <Route path="/admin/llm" component={() => <ProtectedRoute component={AdminLLMPage} />} />
      <Route path="/admin/prompts" component={() => <ProtectedRoute component={AdminPromptsPage} />} />
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
