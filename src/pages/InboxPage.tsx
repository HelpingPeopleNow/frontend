import { h } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { route } from 'preact-router';
import { log, logError } from '../lib/logger';
import { useLanguage } from '../i18n';
import { useDirectMessages } from '../store/directMessages';
import AppShell from '../AppShell';

export default function InboxPage() {
  const { t } = useLanguage();
  const { conversations, loadInbox, connect, disconnect, sseStatus } =
    useDirectMessages();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  document.title = `${t('dm.inbox.title')} | Helping People`;

  useEffect(() => {
    log('inbox', 'loading inbox');
    loadInbox()
      .catch((e) => {
        logError('inbox', `load failed: ${e instanceof Error ? e.message : String(e)}`);
        setError(t('dm.contact.error'));
      })
      .finally(() => setLoading(false));
    connect();
    return () => disconnect();
  }, []);

  const active = conversations.filter(c => c.status === 'active');

  return (
    <AppShell currentPath="/inbox" title={t('dm.inbox.title')}>
      <div class="inbox-page">
        {/* SSE status indicator */}
        <div class="dm-status-bar">
          <span>
            <span class={`dm-status-dot ${sseStatus}`} />
            {t(`dm.status.${sseStatus}`)}
          </span>
        </div>

        {loading ? (
          <div class="loading"><div class="spinner" /></div>
        ) : error ? (
          <div class="dm-empty">
            <div class="dm-empty-icon">⚠️</div>
            <h3>{t('dm.contact.error.title')}</h3>
            <p>{error}</p>
            <button class="btn btn-primary btn-sm" onClick={() => { setError(''); setLoading(true); loadInbox().finally(() => setLoading(false)); }}>
              {t('auth.try.again')}
            </button>
          </div>
        ) : active.length === 0 ? (
          <div class="dm-empty">
            <div class="dm-empty-icon">💬</div>
            <h3>{t('dm.inbox.empty.title')}</h3>
            <p>{t('dm.inbox.empty.desc')}</p>
          </div>
        ) : (
          <div class="dm-conv-list">
            {active.map(c => (
              <button
                key={c.id}
                class="dm-conv-item"
                onClick={() => route(`/inbox/${c.id}`, false)}
              >
                <div class="dm-conv-avatar">
                  {(c.other_party.name || '?')[0].toUpperCase()}
                </div>
                <div class="dm-conv-body">
                  <div class="dm-conv-name">
                    {c.other_party.name}
                    <span class="dm-conv-role">{t(`dm.type.${c.other_party.type}`)}</span>
                  </div>
                  {c.last_message && (
                    <div class="dm-conv-preview">{c.last_message.preview}</div>
                  )}
                </div>
                <div class="dm-conv-meta">
                  {c.last_message && (
                    <div class="dm-conv-time">
                      {new Date(c.last_message.at).toLocaleDateString()}
                    </div>
                  )}
                  {c.unread_count > 0 && (
                    <span class="dm-badge">{c.unread_count}</span>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
