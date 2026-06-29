import { h } from 'preact';
import { useState, useRef, useEffect } from 'preact/hooks';
import { route } from 'preact-router';
import { useAuth } from './AuthProvider';
import { useLanguage, LangToggle } from './i18n';
import { useDirectMessages } from './store/directMessages';

/**
 * LandingNavBar — full navbar for LandingPage.
 *
 * Logged-out state:
 *   [logo]  [Find a Pro]  [How it works]   [Sign in]
 *
 * Logged-in state (matches AppShell style):
 *   [logo]  [Find a Pro]  [Messages (badge)]   [Avatar▾] → menu with logout
 *
 * Sticky top, transparent on hero, fades to white when scrolled.
 */
export default function LandingNavBar() {
  const { session, logout, loading } = useAuth();
  const { t } = useLanguage();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const unreadTotal = useDirectMessages(s => s.unreadTotal);

  // Fade navbar background on scroll
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return;
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [menuOpen]);

  const go = (path: string, replace = false) => {
    setMenuOpen(false);
    route(path, replace);
  };

  const handleLogout = async () => {
    setMenuOpen(false);
    await logout();
    go('/login', true);
  };

  const userInitial = (session?.user?.name || session?.user?.email || '?')[0].toUpperCase();
  const userLabel = session?.user?.name || session?.user?.email || '';

  return (
    <nav class={`landing-nav landing-nav-full ${scrolled ? 'is-scrolled' : ''}`}>
      {/* Left: logo + primary nav */}
      <div class="landing-nav-left">
        <a
          href="/"
          class="logo"
          onClick={(e) => { e.preventDefault(); go('/', false); }}
          style={{ cursor: 'pointer' }}
        >
          <span class="logo-mark">H</span>
          <span>Helping People</span>
        </a>

        {/* Desktop primary nav links */}
        <div class="landing-nav-primary">
          <button class="nav-link" onClick={() => go('/find')}>
            🔍 {t('nav.find')}
          </button>
          {session && (
            <button class="nav-link" onClick={() => go('/inbox')}>
              ✉️ {t('nav.inbox')}
              {unreadTotal > 0 && <span class="nav-badge">{unreadTotal}</span>}
            </button>
          )}
          {!loading && !session && (
            <a class="nav-link nav-link-external" href="#features">
              {t('landing.nav.how_it_works')}
            </a>
          )}
        </div>
      </div>

      {/* Right: lang + auth */}
      <div class="landing-nav-right">
        <LangToggle />

        {loading ? (
          <div class="spinner" style={{ width: 20, height: 20 }} />
        ) : session ? (
          <div class="landing-nav-user" ref={menuRef}>
            <button
              class="avatar-btn"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-expanded={menuOpen}
              aria-label={t('auth.logout')}
              title={userLabel}
            >
              {userInitial}
            </button>
            {menuOpen && (
              <div class="user-menu">
                <div class="user-menu-header">
                  <div class="user-menu-name">{userLabel}</div>
                </div>
                <button class="user-menu-item" onClick={() => go('/find')}>
                  🔍 {t('nav.find')}
                </button>
                <button class="user-menu-item" onClick={() => go('/inbox')}>
                  ✉️ {t('nav.inbox')}
                  {unreadTotal > 0 && <span class="nav-badge">{unreadTotal}</span>}
                </button>
                <div class="user-menu-divider" />
                <button class="user-menu-item user-menu-logout" onClick={handleLogout}>
                  🚪 {t('auth.logout')}
                </button>
              </div>
            )}
          </div>
        ) : (
          <button class="btn btn-primary btn-sm" onClick={() => go('/login')}>
            {t('auth.signin')}
          </button>
        )}
      </div>
    </nav>
  );
}