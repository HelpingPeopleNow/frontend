import { h, ComponentChildren } from 'preact';
import { useState } from 'preact/hooks';
import { route } from 'preact-router';
import { useAuth } from './AuthProvider';
import { useLanguage, LangToggle } from './i18n';

interface AppShellProps {
  children: ComponentChildren;
  currentPath: string;
  title: string;
}

export default function AppShell({ children, currentPath, title }: AppShellProps) {
  const { session, logout } = useAuth();
  const { t } = useLanguage();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = [
    { path: '/chat', icon: '💬', label: t('nav.chat') },
    { path: '/worker', icon: '🔧', label: t('nav.worker.profile'), show: session?.user?.role === 'worker' || !session?.user?.role },
    { path: '/client', icon: '🏠', label: t('nav.client.portal'), show: session?.user?.role === 'client' || !session?.user?.role },
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
          <div class="sidebar-logo">
            <span class="logo-mark">H</span>
            <span>HelpingPeopleNow</span>
          </div>
        </div>

        <nav class="sidebar-nav">
          <div class="sidebar-section-label">Main</div>
          {navItems.filter(n => n.show !== false).map(item => (
            <button
              key={item.path}
              class={`sidebar-link ${currentPath === item.path ? 'active' : ''}`}
              onClick={() => handleNav(item.path)}
            >
              <span class="icon">{item.icon}</span>
              <span class="label">{item.label}</span>
            </button>
          ))}
        </nav>

        <div class="sidebar-footer">
          <div class="sidebar-user">
            <div class="sidebar-avatar">{userInitial}</div>
            <div class="sidebar-user-info">
              <div class="sidebar-user-name">{session?.user?.name || session?.user?.email}</div>
              {session?.user?.role && (
                <div class="sidebar-user-role">{session.user.role}</div>
              )}
            </div>
          </div>

        </div>
      </aside>

      {/* ── Mobile header ──────────────────────────── */}
      <header class="mobile-header">
        <div class="logo">
          <span class="logo-mark">H</span>
          <span>HelpingPeopleNow</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
          <LangToggle />
          <button class="btn btn-ghost btn-sm" onClick={handleLogout} style={{ padding: '5px 8px', fontSize: 'var(--text-xs)' }}>
            {t('auth.logout')}
          </button>
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
            <LangToggle />
            <button class="btn btn-ghost btn-sm" onClick={handleLogout}>
              {t('auth.logout')}
            </button>
          </div>
        </header>
        <div class="app-content">
          {children}
        </div>
      </div>
    </div>
  );
}
