import { h } from 'preact';
import { useState, useEffect, useRef } from 'preact/hooks';
import { route } from 'preact-router';
import { useLanguage, LangToggle } from './i18n';

const API = '/api';

interface ClientProfile {
  id?: number;
  user_id?: string;
  full_name: string;
  phone: string;
  city: string;
  address: string;
  bio: string;
  created_at?: string;
  updated_at?: string;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ClientChatResponse {
  answer: string;
  detected_fields?: Partial<ClientProfile> | null;
  conversation_id?: string;
}

interface ConversationListItem {
  id: string;
  type: string;
  title: string;
  metadata?: { type?: string; completed?: boolean };
  created_at: string;
  updated_at: string;
}

export default function ClientPage() {
  const { t } = useLanguage();

  // ── Profile state ──────────────────────────────────────────────────────
  const [profile, setProfile] = useState<ClientProfile>({
    full_name: '',
    phone: '',
    city: '',
    address: '',
    bio: '',
  });
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // ── Chat state ─────────────────────────────────────────────────────────
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatSending, setChatSending] = useState(false);
  const [conversationID, setConversationID] = useState<string | null>(null);
  const [conversations, setConversations] = useState<ConversationListItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  const chatBoxRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // ── Load profile on mount ──────────────────────────────────────────────
  useEffect(() => {
    fetch(`${API}/v1/client/profile`)
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data: ClientProfile) => {
        if (data.full_name || data.phone || data.city || data.address || data.bio) {
          setProfile({
            full_name: data.full_name || '',
            phone: data.phone || '',
            city: data.city || '',
            address: data.address || '',
            bio: data.bio || '',
          });
        }
        setProfileLoaded(true);
      })
      .catch(err => {
        console.error('[Client] Failed to load profile:', err);
        setProfileLoaded(true);
      });
  }, []);

  // ── Auto-focus after send ─────────────────────────────────────────────
  useEffect(() => {
    if (!chatSending && inputRef.current) {
      inputRef.current.focus();
    }
  }, [chatSending]);

  // ── Load conversations on mount (for history) ─────────────────────────
  const loadConversations = async () => {
    try {
      const r = await fetch(`${API}/v1/conversations?type=client&limit=20`);
      if (!r.ok) return;
      const data = await r.json();
      setConversations(data.conversations || []);
    } catch (err) {
      console.error('[Client] Failed to load conversations:', err);
    }
  };

  useEffect(() => {
    loadConversations();
  }, []);

  // ── Form helpers ───────────────────────────────────────────────────────
  const updateField = (field: keyof ClientProfile, value: string) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  // ── Merge detected fields from chat into the form ─────────────────────
  const mergeDetectedFields = (fields: Partial<ClientProfile>) => {
    setProfile(prev => {
      const merged = { ...prev };
      for (const [key, value] of Object.entries(fields)) {
        if (value !== undefined && value !== null) {
          (merged as any)[key] = typeof value === 'string' ? value : String(value);
        }
      }
      return merged;
    });
  };

  // ── Save profile ──────────────────────────────────────────────────────
  const handleSave = async () => {
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch(`${API}/v1/client/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      });
      if (res.ok) {
        setMsg({ type: 'success', text: t('client.saved') });
        setTimeout(() => setMsg(null), 3000);
      } else {
        const data = await res.json();
        setMsg({ type: 'error', text: data.error || t('client.save.error') });
      }
    } catch {
      setMsg({ type: 'error', text: t('client.save.error') });
    } finally {
      setSaving(false);
    }
  };

  // ── Chat ──────────────────────────────────────────────────────────────
  const sendMessage = async () => {
    const msgText = chatInput.trim();
    if (!msgText || chatSending) return;

    setChatSending(true);
    setChatInput('');

    const userMsg: ChatMessage = { role: 'user', content: msgText };
    setChatMessages(prev => [...prev, userMsg]);

    try {
      const res = await fetch(`${API}/v1/client/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: msgText,
          history: chatMessages.map(({ role, content }) => ({ role, content })),
          conversation_id: conversationID,
        }),
      });

      if (!res.ok) {
        setChatMessages(prev => [...prev, { role: 'assistant', content: t('client.chat.error') }]);
        return;
      }

      const data: ClientChatResponse = await res.json();
      const reply = data.answer || t('client.chat.empty');
      setChatMessages(prev => [...prev, { role: 'assistant', content: reply }]);

      // Merge detected fields into the form
      if (data.detected_fields) {
        mergeDetectedFields(data.detected_fields);
      }

      // Track conversation ID (returned on first message)
      if (data.conversation_id) {
        setConversationID(data.conversation_id);
      }
    } catch {
      setChatMessages(prev => [...prev, { role: 'assistant', content: t('client.chat.error') }]);
    } finally {
      setChatSending(false);
      // Reload conversations list to pick up new conv IDs
      loadConversations();
    }
  };

  const handleChatKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // ── Load a previous conversation into the chat ─────────────────────────
  const loadConversation = async (convId: string) => {
    try {
      const r = await fetch(`${API}/v1/conversations/${convId}`);
      if (!r.ok) return;
      const data = await r.json();
      if (data.messages && Array.isArray(data.messages)) {
        setChatMessages(data.messages.map((m: any) => ({
          role: m.role,
          content: m.content,
        })));
        // Filter out system/field messages to show only user+assistant
        setConversationID(convId);
      }
    } catch (err) {
      console.error('[Client] Failed to load conversation:', err);
    }
    setShowHistory(false);
  };

  // ── Reset role ─────────────────────────────────────────────────────────
  const handleResetRole = async () => {
    try {
      await fetch(`${API}/v1/user/reset-role`, { method: 'POST' });
    } catch { /* ignore */ }
    route('/', true);
  };

  // ── Logout ─────────────────────────────────────────────────────────────
  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch { /* ignore */ }
    route('/login', true);
  };

  // ── Render ──────────────────────────────────────────────────────────────
  if (!profileLoaded) {
    return <div class="role-page"><div class="role-content"><p>{t('client.loading')}</p></div></div>;
  }

  return (
    <div class="role-page">
      {/* Header */}
      <div class="role-header">
        <h2>{t('client.title')}</h2>
        <div class="header-right">
          <LangToggle />
          <span class="user-email">{/* user email shown only if available */}</span>
          <button class="btn-chat" onClick={() => setShowHistory(!showHistory)}>
            {showHistory ? '✕' : '☰'}
          </button>
          <button class="btn-logout" onClick={handleLogout}>{t('auth.logout')}</button>
          <button class="btn-reset" onClick={handleResetRole}>{t('client.reset.role')}</button>
        </div>
      </div>

      <div class="role-content">
        {/* Conversation history sidebar */}
        {showHistory && (
          <div style={{ marginBottom: '0.5rem', padding: '0.5rem', background: '#16213e', borderRadius: '6px', maxHeight: '200px', overflowY: 'auto' }}>
            <strong style={{ color: '#00d4ff', fontSize: '0.85rem' }}>Previous conversations</strong>
            {conversations.length === 0 && <p style={{ color: '#888', fontSize: '0.8rem' }}>No previous conversations</p>}
            {conversations.map(c => (
              <div key={c.id} onClick={() => loadConversation(c.id)} style={{ padding: '0.3rem 0.5rem', cursor: 'pointer', color: '#ccc', fontSize: '0.85rem', borderBottom: '1px solid #333' }}>
                {c.title || c.id.slice(0, 8)}
                <span style={{ color: '#666', fontSize: '0.75rem', marginLeft: '0.5rem' }}>
                  {new Date(c.updated_at).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        )}

        <div class="two-col">
          {/* Chat Column */}
          <div class="col-chat">
            <h3 style={{ margin: '0 0 0.5rem', color: '#e0e0ff', fontSize: '1rem' }}>{t('client.chat.title')}</h3>
            <p style={{ margin: '0 0 0.5rem', color: '#888', fontSize: '0.85rem' }}>{t('client.chat.welcome')}</p>
            <p style={{ margin: '0 0 0.5rem', color: '#555', fontSize: '0.8rem' }}>
              {t('client.chat.example')} <em>{t('client.chat.example.text')}</em>
            </p>

            <div class="chat-box" ref={chatBoxRef}>
              {chatMessages.length === 0 && (
                <div class="chat-welcome">{t('client.chat.welcome')}</div>
              )}
              {chatMessages.map((m, i) => (
                <div key={i} class={`chat-bubble ${m.role === 'user' ? 'chat-user' : 'chat-assistant'}`}>
                  <div class="chat-role-label">{m.role === 'user' ? t('client.chat.you') : t('client.chat.assistant')}</div>
                  <div class="chat-content">{m.content}</div>
                </div>
              ))}
              {chatSending && (
                <div class="chat-bubble chat-assistant">
                  <div class="chat-role-label">{t('client.chat.assistant')}</div>
                  <div class="chat-content">{t('client.chat.typing')}</div>
                </div>
              )}
            </div>

            <div class="chat-input-row">
              <input
                ref={inputRef}
                type="text"
                value={chatInput}
                onKeyDown={handleChatKeyDown}
                onInput={(e) => setChatInput(e.currentTarget.value)}
                placeholder={chatMessages.length === 0 ? t('client.chat.placeholder.start') : t('client.chat.placeholder.answer')}
                disabled={chatSending}
              />
              <button class="btn-send" onClick={sendMessage} disabled={chatSending || !chatInput.trim()}>
                {chatSending ? '…' : t('client.chat.send')}
              </button>
            </div>
          </div>

          {/* Form Column */}
          <div class="col-form">
            {/* Status message */}
            {msg && <div class={`msg ${msg.type === 'success' ? 'msg-success' : 'msg-error'}`}>{msg.text}</div>}

            {/* Personal Information */}
            <div class="section">
              <h3 class="section-title">{t('client.form.personal')}</h3>

              <label class="field">
                <span>{t('client.form.full_name')}</span>
                <input type="text" value={profile.full_name} onInput={e => updateField('full_name', (e.target as HTMLInputElement).value)} placeholder="John Doe" />
              </label>

              <label class="field">
                <span>{t('client.form.phone')}</span>
                <input type="tel" value={profile.phone} onInput={e => updateField('phone', (e.target as HTMLInputElement).value)} placeholder="+34 600 000 000" />
              </label>
            </div>

            {/* Location */}
            <div class="section">
              <h3 class="section-title">{t('client.form.location')}</h3>

              <label class="field">
                <span>{t('client.form.city')}</span>
                <input type="text" value={profile.city} onInput={e => updateField('city', (e.target as HTMLInputElement).value)} placeholder="Madrid" />
              </label>

              <label class="field">
                <span>{t('client.form.address')}</span>
                <input type="text" value={profile.address} onInput={e => updateField('address', (e.target as HTMLInputElement).value)} placeholder="Calle Mayor 1 (optional)" />
              </label>
            </div>

            {/* Bio */}
            <div class="section">
              <h3 class="section-title">{t('client.form.bio')}</h3>

              <label class="field">
                <span>{t('client.form.bio')} <span style={{ color: '#666' }}>({t('client.form.optional')})</span></span>
                <textarea rows={3} value={profile.bio} onInput={e => updateField('bio', (e.target as HTMLInputElement).value)} placeholder={t('client.form.bio.placeholder')} />
              </label>
            </div>

            {/* Save */}
            <div class="save-area">
              <button class="btn-save" onClick={handleSave} disabled={saving}>
                {saving ? t('client.saving') : t('client.save')}
              </button>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .role-page { display: flex; flex-direction: column; height: 100vh; max-width: 1200px; margin: 0 auto; }
        .role-header { display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 1rem; background: #1a1a2e; border-bottom: 1px solid #333; }
        .role-header h2 { margin: 0; font-size: 1.2rem; color: #4a6cf7; }
        .role-content { flex: 1; padding: 1rem; overflow-y: auto; display: flex; flex-direction: column; }
        .header-right { display: flex; align-items: center; gap: 0.5rem; }
        .user-email { color: #888; font-size: 0.85rem; }
        .btn-chat, .btn-logout, .btn-reset { padding: 0.35rem 0.75rem; border: none; border-radius: 4px; cursor: pointer; font-size: 0.85rem; }
        .btn-chat { background: #4a6cf7; color: white; }
        .btn-logout { background: #444; color: #ccc; }
        .btn-reset { background: #6b1a1a; color: #f88; }

        .two-col { display: flex; gap: 1rem; flex: 1; min-height: 0; }

        .col-chat { flex: 0 0 380px; display: flex; flex-direction: column; border-right: 1px solid #333; padding-right: 1rem; }
        .chat-box { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 0.5rem; min-height: 200px; }
        .chat-welcome { color: #888; font-size: 0.9rem; text-align: center; padding: 2rem 0.5rem; }
        .chat-bubble { padding: 0.5rem 0.7rem; border-radius: 6px; max-width: 100%; }
        .chat-user { background: #1e3a5f; align-self: flex-end; }
        .chat-assistant { background: #2a2a3e; align-self: flex-start; }
        .chat-role-label { font-size: 0.7rem; color: #888; margin-bottom: 0.2rem; text-transform: uppercase; }
        .chat-content { font-size: 0.9rem; color: #e0e0ff; white-space: pre-wrap; word-break: break-word; }
        .chat-input-row { display: flex; gap: 0.35rem; }
        .chat-input-row input { flex: 1; background: #1a1a2e; border: 1px solid #444; border-radius: 4px; color: #e0e0ff; padding: 0.5rem 0.6rem; font-size: 0.9rem; }
        .chat-input-row input:focus { outline: none; border-color: #4a6cf7; }
        .chat-input-row input:disabled { opacity: 0.5; }
        .btn-send { padding: 0.5rem 0.8rem; background: #4a6cf7; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.9rem; white-space: nowrap; }
        .btn-send:hover { background: #5a7cf8; }
        .btn-send:disabled { background: #333; color: #666; cursor: not-allowed; }

        .col-form { flex: 1; overflow-y: auto; padding-left: 0.5rem; }

        .section { margin-bottom: 1.5rem; }
        .section-title { color: #e0e0ff; font-size: 1rem; border-bottom: 1px solid #333; padding-bottom: 0.5rem; margin-bottom: 1rem; }

        .field { display: flex; flex-direction: column; gap: 0.25rem; margin-bottom: 0.75rem; }
        .field span { color: #aaa; font-size: 0.85rem; }
        .field input, .field select, .field textarea {
          background: #1a1a2e; border: 1px solid #444; border-radius: 4px; color: #e0e0ff; padding: 0.5rem 0.6rem; font-size: 0.9rem;
        }
        .field input:focus, .field select:focus, .field textarea:focus { outline: none; border-color: #4a6cf7; }
        .field textarea { resize: vertical; }

        .save-area { margin: 1.5rem 0; }
        .btn-save { width: 100%; padding: 0.75rem; background: #4a6cf7; color: white; border: none; border-radius: 6px; font-size: 1rem; cursor: pointer; }
        .btn-save:hover { background: #5a7cf8; }
        .btn-save:disabled { background: #333; color: #666; cursor: not-allowed; }

        .msg { padding: 0.6rem 0.8rem; border-radius: 4px; margin-bottom: 1rem; font-size: 0.9rem; }
        .msg-error { background: #3a1a1a; color: #f88; border: 1px solid #522; }
        .msg-success { background: #1a3a1a; color: #8f8; border: 1px solid #252; }
      `}</style>
    </div>
  );
}
