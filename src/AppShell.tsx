import { h, ComponentChildren } from 'preact';
import { useState } from 'preact/hooks';
import { route } from 'preact-router';
import { useAuth } from './AuthProvider';
import { useLanguage, LangToggle } from './i18n';
import { useDirectMessages } from './store/directMessages';

interface AppShellProps {
  children: ComponentChildren;
  currentPath: string;
  title: string;
}

export default function AppShell({ children, currentPath, title }: AppShellProps) {
  const { session, logout } = useAuth();
  const { t } = useLanguage();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const unreadTotal = useDirectMessages(s => s.unreadTotal);

  const navItems = [
    { path: '/chat', icon: '💬', label: t('nav.chat') },
    { path: '/find', icon: '🔍', label: t('nav.find') },
    { path: '/inbox', icon: '✉️', label: t('nav.inbox'), badge: unreadTotal },
    { path: '/admin', icon: '⚙️', label: t('nav.admin') },
  ];

  const userInitial = (session?.user?.name || session?.user?.email || '?')[0].toUpperCase();

  const handleNav = (path: string) => {
    route(path, true);
    setSidebarOpen(false);
  };

  const handleLogout = async () => {
    await logout();
    route('/login', true);
  };

  return (
    <div class="app-shell">
      {/* ── Sidebar overlay (mobile) ──────────────── */}
      <div
        class={`sidebar-overlay ${sidebarOpen ? 'visible' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* ── Sidebar ────────────────────────────────── */}
      <aside class={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div class="sidebar-header">
          <button class="sidebar-logo" onClick={() => handleNav('/')}>
            <span class="logo-mark">H</span>
            <span>Helping People</span>
          </button>
        </div>

        <nav class="sidebar-nav">
          <div class="sidebar-section-label">{t('sidebar.main')}</div>
          {navItems.map(item => (
            <button
              key={item.path}
              class={`sidebar-link ${currentPath === item.path ? 'active' : ''}`}
              onClick={() => handleNav(item.path)}
            >
              <span class="icon">{item.icon}</span>
              <span class="label">{item.label}</span>
              {('badge' in item ? (item.badge as number) : 0) > 0 && (
                <span class="nav-badge">{item.badge as number}</span>
              )}
            </button>
          ))}
        </nav>

        <div class="sidebar-footer">
          <div class="sidebar-user">
            <div class="sidebar-avatar">{userInitial}</div>
            <div class="sidebar-user-info">
              <div class="sidebar-user-name">{session?.user?.name || session?.user?.email}</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 'var(--sp-2)', marginTop: 'var(--sp-3)' }}>
            <LangToggle style={{ flex: 1 }} />
            <button class="btn btn-ghost btn-sm" onClick={handleLogout} style={{ flex: 1 }}>
              {t('auth.logout')}
            </button>
          </div>
        </div>
      </aside>

      {/* ── Mobile header ──────────────────────────── */}
      <header class="mobile-header">
        <button class="logo" onClick={() => handleNav('/')}>
          <span class="logo-mark">H</span>
          <span>Helping People</span>
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
          <button class="hamburger" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? '✕' : '☰'}
          </button>
        </div>
      </header>

      {/* ── Main content ───────────────────────────── */}
      <div class="app-main">
        <header class="app-header">
          <h1 class="app-header-title">{title}</h1>
          <div class="app-header-actions">
          </div>
        </header>
        <div class="app-content">
          {children}
        </div>
      </div>
    </div>
  );
}
