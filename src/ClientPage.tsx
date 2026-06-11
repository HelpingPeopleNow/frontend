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
    return <div class="page"><div class="loading"><p>{t('client.loading')}</p></div></div>;
  }

  return (
    <div class="page">
      {/* Header */}
      <div class="page-header">
        <h2>{t('client.title')}</h2>
        <div class="header-right">
          <LangToggle />
          <span class="user-email">{/* user email shown only if available */}</span>
          <button class="btn btn-ghost btn-sm" onClick={() => setShowHistory(!showHistory)}>
            {showHistory ? '✕' : '☰'}
          </button>
          <button class="btn btn-danger btn-sm" onClick={handleLogout}>{t('auth.logout')}</button>
          <button class="btn btn-danger btn-sm" onClick={handleResetRole}>{t('client.reset.role')}</button>
        </div>
      </div>

      <div class="page-content">
        {/* Conversation history sidebar */}
        {showHistory && (
          <div class="history-sidebar">
            <div class="history-sidebar-header">Previous conversations</div>
            {conversations.length === 0 && <p>No previous conversations</p>}
            {conversations.map(c => (
              <div key={c.id} class="history-item" onClick={() => loadConversation(c.id)}>
                <span>{c.title || c.id.slice(0, 8)}</span>
                <span class="history-item-date">{new Date(c.updated_at).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        )}

        <div class="two-col">
          {/* Chat Column */}
          <div class="col-chat">
            <h3>{t('client.chat.title')}</h3>
            <p>{t('client.chat.welcome')}</p>
            <p>
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
                class="input"
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
                <input class="input" type="text" value={profile.full_name} onInput={e => updateField('full_name', (e.target as HTMLInputElement).value)} placeholder="John Doe" />
              </label>

              <label class="field">
                <span>{t('client.form.phone')}</span>
                <input class="input" type="tel" value={profile.phone} onInput={e => updateField('phone', (e.target as HTMLInputElement).value)} placeholder="+34 600 000 000" />
              </label>
            </div>

            {/* Location */}
            <div class="section">
              <h3 class="section-title">{t('client.form.location')}</h3>

              <label class="field">
                <span>{t('client.form.city')}</span>
                <input class="input" type="text" value={profile.city} onInput={e => updateField('city', (e.target as HTMLInputElement).value)} placeholder="Madrid" />
              </label>

              <label class="field">
                <span>{t('client.form.address')}</span>
                <input class="input" type="text" value={profile.address} onInput={e => updateField('address', (e.target as HTMLInputElement).value)} placeholder="Calle Mayor 1 (optional)" />
              </label>
            </div>

            {/* Bio */}
            <div class="section">
              <h3 class="section-title">{t('client.form.bio')}</h3>

              <label class="field">
                <span>{t('client.form.bio')} <span>({t('client.form.optional')})</span></span>
                <textarea class="textarea" rows={3} value={profile.bio} onInput={e => updateField('bio', (e.target as HTMLInputElement).value)} placeholder={t('client.form.bio.placeholder')} />
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
    </div>
  );
}
