import { h } from 'preact';
import { Router, Route, route } from 'preact-router';
import { useEffect } from 'preact/hooks';
import { AuthProvider, useAuth } from './AuthProvider';
import { log } from './lib/logger';
import ErrorBoundary from './components/ErrorBoundary';
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
import WorkerContactPage from './pages/WorkerContactPage';
import InboxPage from './pages/InboxPage';
import DirectMessagePage from './pages/DirectMessagePage';
import PublicProfilePage from './pages/PublicProfilePage';
import TermsPage from './pages/TermsPage';
import PrivacyPage from './pages/PrivacyPage';
import CookiesPage from './pages/CookiesPage';
import CookieConsent from './components/CookieConsent';
import FeedbackWidget from './components/feedback/FeedbackWidget';
import FeedbackAdminPage from './FeedbackAdminPage';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ProtectedRoute({ component: Component, ...props }: { component: preact.ComponentType<any>; [key: string]: unknown }) {
  const { session, loading } = useAuth();
  useEffect(() => {
    if (!loading && !session) {
      log('auth', 'redirecting to login — no session');
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
      <Route path="/" component={() => <ErrorBoundary><LandingPage /></ErrorBoundary>} />
      <Route path="/login" component={({ onNavigate }: { onNavigate?: (path: string) => void }) => <ErrorBoundary><LoginPage onNavigate={onNavigate || ((p: string) => route(p))} /></ErrorBoundary>} onNavigate={(p: string) => route(p)} />
      <Route path="/terms" component={() => <ErrorBoundary><TermsPage /></ErrorBoundary>} />
      <Route path="/privacy" component={() => <ErrorBoundary><PrivacyPage /></ErrorBoundary>} />
      <Route path="/cookies" component={() => <ErrorBoundary><CookiesPage /></ErrorBoundary>} />
      <Route path="/chat" component={() => <ErrorBoundary><ProtectedRoute component={ChatPage} /></ErrorBoundary>} />
      <Route path="/find" component={() => <ErrorBoundary><ProtectedRoute component={FindPage} /></ErrorBoundary>} />

      {/* Direct Messages */}
      <Route path="/inbox" component={() => <ErrorBoundary><ProtectedRoute component={InboxPage} /></ErrorBoundary>} />
      <Route path="/inbox/:convId" component={({ convId }: { convId: string }) => <ErrorBoundary><ProtectedRoute component={DirectMessagePage} convId={convId} /></ErrorBoundary>} />
      <Route path="/workers/:workerId" component={({ workerId }: { workerId: string }) => <ErrorBoundary><ProtectedRoute component={WorkerContactPage} workerId={workerId} /></ErrorBoundary>} />
      <Route path="/profile/:slug" component={({ slug }: { slug: string }) => <ErrorBoundary><PublicProfilePage slug={slug} /></ErrorBoundary>} />

      {/* Admin */}
      <Route path="/admin" component={() => <ErrorBoundary><ProtectedRoute component={AdminPage} /></ErrorBoundary>} />
      <Route path="/admin/llm" component={() => <ErrorBoundary><ProtectedRoute component={AdminLLMPage} /></ErrorBoundary>} />
      <Route path="/admin/prompts" component={() => <ErrorBoundary><ProtectedRoute component={AdminPromptsPage} /></ErrorBoundary>} />

      {/* Users */}
      <Route path="/admin/users" component={() => <ErrorBoundary><ProtectedRoute component={UsersPage} /></ErrorBoundary>} />
      <Route path="/admin/users/:id" component={({ id }: { id: string }) => <ErrorBoundary><ProtectedRoute component={UserDetailPage} id={id} /></ErrorBoundary>} />

      {/* Workers */}
      <Route path="/admin/worker-profiles" component={() => <ErrorBoundary><ProtectedRoute component={WorkersPage} /></ErrorBoundary>} />
      <Route path="/admin/worker-profiles/:id" component={({ id }: { id: string }) => <ErrorBoundary><ProtectedRoute component={WorkerDetailPage} id={id} /></ErrorBoundary>} />

      {/* Clients */}
      <Route path="/admin/client-profiles" component={() => <ErrorBoundary><ProtectedRoute component={ClientsPage} /></ErrorBoundary>} />
      <Route path="/admin/client-profiles/:id" component={({ id }: { id: string }) => <ErrorBoundary><ProtectedRoute component={ClientDetailPage} id={id} /></ErrorBoundary>} />

      {/* Conversations */}
      <Route path="/admin/conversations" component={() => <ErrorBoundary><ProtectedRoute component={ConversationsPage} /></ErrorBoundary>} />
      <Route path="/admin/conversations/:id" component={({ id }: { id: string }) => <ErrorBoundary><ProtectedRoute component={ConversationDetailPage} id={id} /></ErrorBoundary>} />

      {/* Messages */}
      <Route path="/admin/messages" component={() => <ErrorBoundary><ProtectedRoute component={MessagesPage} /></ErrorBoundary>} />
      <Route path="/admin/messages/:id" component={({ id }: { id: string }) => <ErrorBoundary><ProtectedRoute component={MessageDetailPage} id={id} /></ErrorBoundary>} />

      {/* Feedback admin */}
      <Route path="/admin/feedback" component={() => <ErrorBoundary><ProtectedRoute component={FeedbackAdminPage} /></ErrorBoundary>} />
    </Router>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <>
      <AppRouter />
      <CookieConsent />
      <FeedbackWidget />
      </>
    </AuthProvider>
  );
}
