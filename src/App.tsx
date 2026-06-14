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
import UsersPage from './UsersPage';
import UserDetailPage from './UserDetailPage';
import WorkersPage from './WorkersPage';
import WorkerDetailPage from './WorkerDetailPage';
import ClientsPage from './ClientsPage';
import ClientDetailPage from './ClientDetailPage';
import ConversationsPage from './ConversationsPage';
import ConversationDetailPage from './ConversationDetailPage';
import MessagesPage from './MessagesPage';
import MessageDetailPage from './MessageDetailPage';
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

      {/* Admin */}
      <Route path="/admin" component={() => <ProtectedRoute component={AdminPage} />} />
      <Route path="/admin/llm" component={() => <ProtectedRoute component={AdminLLMPage} />} />
      <Route path="/admin/prompts" component={() => <ProtectedRoute component={AdminPromptsPage} />} />

      {/* Users */}
      <Route path="/admin/users" component={() => <ProtectedRoute component={UsersPage} />} />
      <Route path="/admin/users/:id" component={({ id }: { id: string }) => <ProtectedRoute component={UserDetailPage} id={id} />} />

      {/* Workers */}
      <Route path="/admin/worker-profiles" component={() => <ProtectedRoute component={WorkersPage} />} />
      <Route path="/admin/worker-profiles/:id" component={({ id }: { id: string }) => <ProtectedRoute component={WorkerDetailPage} id={id} />} />

      {/* Clients */}
      <Route path="/admin/client-profiles" component={() => <ProtectedRoute component={ClientsPage} />} />
      <Route path="/admin/client-profiles/:id" component={({ id }: { id: string }) => <ProtectedRoute component={ClientDetailPage} id={id} />} />

      {/* Conversations */}
      <Route path="/admin/conversations" component={() => <ProtectedRoute component={ConversationsPage} />} />
      <Route path="/admin/conversations/:id" component={({ id }: { id: string }) => <ProtectedRoute component={ConversationDetailPage} id={id} />} />

      {/* Messages */}
      <Route path="/admin/messages" component={() => <ProtectedRoute component={MessagesPage} />} />
      <Route path="/admin/messages/:id" component={({ id }: { id: string }) => <ProtectedRoute component={MessageDetailPage} id={id} />} />
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
