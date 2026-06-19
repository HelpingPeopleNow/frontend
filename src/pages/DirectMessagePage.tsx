import { h } from 'preact';
import { useState, useRef, useEffect } from 'preact/hooks';
import { route } from 'preact-router';
import { useLanguage } from '../i18n';
import { useDirectMessages } from '../store/directMessages';
import { archiveConversation, blockConversation, reportConversation } from '../lib/directMessageApi';
import AppShell from '../AppShell';

interface Props {
  convId: string;
}

export default function DirectMessagePage({ convId }: Props) {
  const { t } = useLanguage();
  const { messagesByConv, loadMessages, sendMessage, markRead, conversations, rateLimited } =
    useDirectMessages();
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'block' | 'report' | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const conv = conversations.find(c => c.id === convId);
  const otherName = conv?.other_party?.name || t('dm.thread.unknown');
  const isBlocked = conv?.status === 'blocked';

  document.title = `${otherName} | HelpingPeopleNow`;

  useEffect(() => {
    loadMessages(convId);
    markRead(convId);
  }, [convId]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [messagesByConv[convId]]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [convId]);

  const msgs = messagesByConv[convId] || [];

  const send = async () => {
    const body = input.trim();
    if (!body || sending || isBlocked) return;
    setInput('');
    setSending(true);
    setError('');
    try {
      await sendMessage(convId, body);
    } catch {
      // error handled via rateLimited state in store
    } finally {
      setSending(false);
    }
  };

  const handleBlock = async () => {
    try {
      await blockConversation(convId);
      setConfirmAction(null);
      setShowActionMenu(false);
    } catch {
      setError(t('dm.contact.error'));
    }
  };

  const handleReport = async () => {
    try {
      await reportConversation(convId);
      setConfirmAction(null);
      setShowActionMenu(false);
    } catch {
      setError(t('dm.contact.error'));
    }
  };

  const handleArchive = async () => {
    try {
      await archiveConversation(convId);
      route('/inbox', false);
    } catch {
      setError(t('dm.contact.error'));
    }
  };

  return (
    <AppShell currentPath="/inbox" title={otherName}>
      <div class="dm-thread">
        <div class="dm-thread-header">
          <div class="dm-thread-avatar">
            {(otherName || '?')[0].toUpperCase()}
          </div>
          <span class="dm-thread-name">
            {otherName}
            {isBlocked && (
              <span style={{ fontSize: '0.65rem', color: 'var(--error)', marginLeft: 'var(--sp-2)' }}>
                {t('dm.block')}
              </span>
            )}
          </span>
          <div class="dm-thread-actions">
            <button
              class="dm-btn-icon"
              onClick={() => setShowActionMenu(!showActionMenu)}
              title={t('dm.report')}
              aria-label={t('dm.report')}
            >
              ⋯
            </button>
          </div>
        </div>

        {/* Action dropdown */}
        {showActionMenu && (
          <div
            style={{
              display: 'flex',
              gap: '4px',
              padding: 'var(--sp-2) var(--sp-4)',
              borderBottom: '1px solid var(--border)',
              background: 'var(--surface)',
            }}
          >
            <button class="btn btn-sm btn-ghost" onClick={handleArchive}>
              📦 {t('dm.archive')}
            </button>
            <button class="btn btn-sm btn-ghost" onClick={() => { setConfirmAction('block'); setShowActionMenu(false); }}>
              🚫 {t('dm.block')}
            </button>
            <button class="btn btn-sm btn-ghost" onClick={() => { setConfirmAction('report'); setShowActionMenu(false); }}>
              ⚠️ {t('dm.report')}
            </button>
          </div>
        )}

        {/* Confirmation dialogs */}
        {confirmAction === 'block' && (
          <div style={{
            padding: 'var(--sp-4)', borderBottom: '1px solid var(--border)',
            background: 'var(--error-subtle)', textAlign: 'center',
          }}>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--error)', marginBottom: 'var(--sp-3)' }}>
              {t('dm.block.desc')}
            </p>
            <div style={{ display: 'flex', gap: 'var(--sp-2)', justifyContent: 'center' }}>
              <button class="btn btn-sm btn-danger" onClick={handleBlock}>{t('dm.block.title')}</button>
              <button class="btn btn-sm btn-secondary" onClick={() => setConfirmAction(null)}>{t('admin.cancel')}</button>
            </div>
          </div>
        )}

        {confirmAction === 'report' && (
          <div style={{
            padding: 'var(--sp-4)', borderBottom: '1px solid var(--border)',
            background: 'var(--warning-subtle)', textAlign: 'center',
          }}>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--warning)', marginBottom: 'var(--sp-3)' }}>
              {t('dm.report.desc')}
            </p>
            <div style={{ display: 'flex', gap: 'var(--sp-2)', justifyContent: 'center' }}>
              <button class="btn btn-sm btn-danger" onClick={handleReport}>{t('dm.report.title')}</button>
              <button class="btn btn-sm btn-secondary" onClick={() => setConfirmAction(null)}>{t('admin.cancel')}</button>
            </div>
          </div>
        )}

        {/* Error banner */}
        {error && (
          <div class="dm-error" onClick={() => setError('')}>
            {error}
          </div>
        )}

        {/* Rate limit hint */}
        {rateLimited && (
          <div class="dm-rate-limit">
            ⏳ {t('dm.rate.limited')}
          </div>
        )}

        <div class="dm-messages" ref={listRef}>
          {msgs.length === 0 ? (
            <div class="dm-empty">
              <div class="dm-empty-icon">💬</div>
              <p>{t('dm.thread.empty')}</p>
            </div>
          ) : (
            msgs.map(m => (
              <div
                key={m.id}
                class={`dm-msg ${m.sender_role === 'client' ? 'dm-msg-sent' : 'dm-msg-recv'}`}
              >
                <div class="dm-msg-body">{m.body}</div>
                <div class="dm-msg-time">
                  {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            ))
          )}
        </div>

        {isBlocked ? (
          <div class="dm-empty" style={{ padding: 'var(--sp-4)', flexShrink: 0, borderTop: '1px solid var(--border)' }}>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--error)' }}>
              🚫 {t('dm.block.desc')}
            </p>
          </div>
        ) : (
          <div class="dm-input-bar">
            <input
              class="input"
              value={input}
              onInput={(e: any) => setInput(e.target.value)}
              onKeyDown={(e: any) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), send())}
              placeholder={t('dm.placeholder')}
              disabled={sending}
              ref={inputRef}
            />
            <button
              class="dm-send-btn"
              onClick={send}
              disabled={sending || !input.trim()}
            >
              ↑
            </button>
          </div>
        )}
      </div>
    </AppShell>
  );
}
