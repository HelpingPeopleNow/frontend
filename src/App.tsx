import { h } from 'preact';
import { Router, Route } from 'preact-router';
import ChatPage from './ChatPage';
import AdminPage from './AdminPage';

export default function App() {
  return (
    <div style={{ minHeight: '100vh', background: '#1a1a2e' }}>
      <nav style={{ padding: '1rem 2rem', background: '#0f3460', display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <a href="/" style={{ color: '#00d4ff', textDecoration: 'none', fontWeight: 600, fontSize: '1.2rem' }}>
          🏠 Home
        </a>
        <a href="/admin" style={{ color: '#e0e0e0', textDecoration: 'none', padding: '0.5rem 1rem', borderRadius: '6px' }}>
          ⚙️ Admin
        </a>
      </nav>
      <Router>
        <Route path="/" component={ChatPage} />
        <Route path="/admin" component={AdminPage} />
      </Router>
    </div>
  );
}