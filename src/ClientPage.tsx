import { h } from 'preact';
import { route } from 'preact-router';
import { useAuth } from './AuthProvider';
import { useLanguage, LangToggle } from './i18n';

export default function ClientPage() {
  const { session, logout, refreshSession } = useAuth();
  const { t } = useLanguage();

  const handleLogout = async () => {
    await logout();
    route('/login', true);
  };

  const handleResetRole = async () => {
    try {
      const res = await fetch(`/api/auth/user/${session?.user?.id}/role`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: '' }),
      });
      if (!res.ok) {
        console.error('[Client] failed to reset role', res.status);
        return;
      }
      await refreshSession();
      route('/', true);
    } catch (e) {
      console.error('[Client] failed to reset role', e);
    }
  };

  return (
    <div class="role-page">
      <div class="role-header">
        <h2>{t('client.title')}</h2>
        <div class="header-right">
          <LangToggle />
          <span class="user-email">{session?.user?.email}</span>
          <button class="btn-chat" onClick={() => route('/', true)}>{t('nav.chat')}</button>
          <button class="btn-reset" onClick={handleResetRole}>{t('client.reset.role')}</button>
          <button class="btn-logout" onClick={handleLogout}>{t('auth.logout')}</button>
        </div>
      </div>
      <div class="role-content">
        <h3>{t('client.find')}</h3>
        <p>{t('client.desc')}</p>
        <div class="placeholder-card">
          <h4>{t('client.post')}</h4>
          <p>{t('client.post.desc')}</p>
        </div>
        <div class="placeholder-card">
          <h4>{t('client.requests')}</h4>
          <p>{t('client.requests.desc')}</p>
        </div>
      </div>
      <style>{`
        .role-page { display: flex; flex-direction: column; height: 100vh; max-width: 800px; margin: 0 auto; }
        .role-header { display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 1rem; background: #1a1a2e; border-bottom: 1px solid #333; }
        .role-header h2 { margin: 0; font-size: 1.2rem; color: #4a6cf7; }
        .role-content { flex: 1; padding: 2rem 1rem; overflow-y: auto; }
        .role-content h3 { color: #e0e0ff; margin-bottom: 0.5rem; }
        .role-content p { color: #888; margin-bottom: 1.5rem; }
        .placeholder-card { background: #1a1a2e; border: 1px solid #333; border-radius: 8px; padding: 1.25rem; margin-bottom: 1rem; }
        .placeholder-card h4 { color: #4a6cf7; margin: 0 0 0.5rem 0; }
        .placeholder-card p { color: #888; margin: 0; font-size: 0.9rem; }
        .header-right { display: flex; align-items: center; gap: 0.5rem; }
        .user-email { color: #888; font-size: 0.85rem; }
        .btn-chat, .btn-logout, .btn-reset { padding: 0.35rem 0.75rem; border: none; border-radius: 4px; cursor: pointer; font-size: 0.85rem; }
        .btn-chat { background: #4a6cf7; color: white; }
        .btn-logout { background: #444; color: #ccc; }
        .btn-reset { background: #6b1a1a; color: #f88; }
      `}</style>
    </div>
  );
}
