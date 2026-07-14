import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { route } from 'preact-router';
import { logError } from './lib/logger';
import { useLanguage } from './i18n';
import AppShell from './AppShell';
import { getEntity, listEntities, deleteEntity } from './services/admin';
import { ApiError } from './services/api';

interface UserRow { id: string; email: string; name: string | null; }

interface DMRow {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  created_at: string;
  read_at: string | null;
  deleted_at: string | null;
}

interface Props { id: string; }

export default function DirectConversationDetailPage({ id }: Props) {
  const { t } = useLanguage();
  document.title = `Admin - Direct Conversation #${id} | Helping People`;
  const [conv, setConv] = useState<Record<string, unknown> | null>(null);
  const [messages, setMessages] = useState<DMRow[]>([]);
  const [userMap, setUserMap] = useState<Record<string, UserRow>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      getEntity<Record<string, unknown>>('direct-conversations', id),
      listEntities<DMRow>('direct-messages', 1000),
      listEntities<UserRow>('users', 1000),
    ])
      .then(([c, dmRows, users]) => {
        const map: Record<string, UserRow> = {};
        for (const u of users) map[u.id] = u;
        setUserMap(map);
        setConv(c);
        setMessages(dmRows
          .filter(m => m.conversation_id === id && !m.deleted_at)
          .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()));
        setLoading(false);
      })
      .catch(err => {
        const msg = err instanceof ApiError ? err.message : err instanceof Error ? err.message : 'request failed';
        logError('admin', `get direct-conversation ${id} failed: ${msg}`);
        setError(msg);
        setLoading(false);
      });
  }, [id]);

  const handleDelete = async () => {
    if (!confirm(t('admin.confirm_delete') || 'Delete this record?')) return;
    try {
      await deleteEntity('direct-conversations', id);
      route('/admin/direct-conversations');
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : err instanceof Error ? err.message : 'request failed';
      logError('admin', `delete direct-conversations/${id} failed: ${msg}`);
      alert(`Delete failed: ${msg}`);
    }
  };

  const labelFor = (uid: string) => {
    const u = userMap[uid];
    if (!u) return uid;
    return u.email || u.name || uid;
  };

  if (loading) return <AppShell currentPath="/admin" title="Admin"><div class="loading"><div class="spinner" /></div></AppShell>;
  if (error) return <AppShell currentPath="/admin" title="Admin"><div class="error-state">{t('admin.error')}: {error}</div></AppShell>;

  const userA = conv?.user_a_id ? String(conv.user_a_id) : '';

  return (
    <AppShell currentPath="/admin" title="Admin">
      <div class="admin-page">
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)', marginBottom: 'var(--sp-5)' }}>
          <button class="btn btn-ghost" onClick={() => route('/admin/direct-conversations')} style={{ fontSize: 'var(--text-lg)' }}>←</button>
          <h2 class="section-title" style={{ margin: 0 }}>📩 Direct Conversation #{id}</h2>
          <div style={{ flex: 1 }} />
          <button class="btn btn-ghost" onClick={handleDelete} style={{ color: 'var(--error)' }}>
            {t('admin.delete') || 'Delete'}
          </button>
        </div>

        {conv && (
          <div class="admin-card" style={{ marginBottom: 'var(--sp-5)' }}>
            {Object.entries(conv).map(([key, val]) => {
              let display = val;
              if (key === 'user_a_id') display = labelFor(String(val));
              if (key === 'user_b_id') display = labelFor(String(val));
              return (
                <div class="entity-field" key={key}>
                  <label class="entity-field-label">{key}</label>
                  <div class="entity-field-value">
                    {display === null ? <span class="text-muted">null</span> : String(display)}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <h3 class="section-title" style={{ marginBottom: 'var(--sp-4)' }}>
          {t('admin.menu.messages') || 'Messages'} ({messages.length})
        </h3>
        {messages.length === 0 ? (
          <div class="empty-state">{t('admin.no_records') || 'No records found.'}</div>
        ) : (
          <div class="admin-transcript">
            {messages.map(m => {
              const own = m.sender_id === userA;
              return (
                <div class={`dm-bubble ${own ? 'dm-out' : 'dm-in'}`} key={m.id}>
                  <div class="dm-bubble-meta">
                    <span class="dm-bubble-sender">{labelFor(m.sender_id)}</span>
                    <span class="dm-bubble-time">{new Date(m.created_at).toLocaleString()}</span>
                  </div>
                  <div class="dm-bubble-body">{m.body}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
