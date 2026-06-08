import { h } from 'preact';
import { Router, Route } from 'preact-router';
import { useEffect } from 'preact/hooks';
import ChatPage from './ChatPage';
import AdminPage from './AdminPage';

function useNavigationLogger() {
  useEffect(() => {
    const handler = () => console.log(`[Nav] Route: ${window.location.pathname}${window.location.search}`);
    window.addEventListener('popstate', handler);
    console.log(`[Nav] Initial route: ${window.location.pathname}${window.location.search}`);
    return () => window.removeEventListener('popstate', handler);
  }, []);
}

export default function App() {
  useNavigationLogger();

  const handleRouteChange = (e: { url: string }) => {
    console.log(`[Nav] Navigated to: ${e.url}`);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#1a1a2e' }}>
      <nav style={{ padding: '1rem 2rem', background: '#0f3460', display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <a href="/" onClick={() => console.log('[Nav] Click: Home')} style={{ color: '#00d4ff', textDecoration: 'none', fontWeight: 600, fontSize: '1.2rem' }}>
          🏠 Home
        </a>
        <a href="/admin" onClick={() => console.log('[Nav] Click: Admin')} style={{ color: '#e0e0e0', textDecoration: 'none', padding: '0.5rem 1rem', borderRadius: '6px' }}>
          ⚙️ Admin
        </a>
      </nav>
      <Router onChange={handleRouteChange}>
        <Route path="/" component={ChatPage} />
        <Route path="/admin" component={AdminPage} />
      </Router>
    </div>
  );
}
