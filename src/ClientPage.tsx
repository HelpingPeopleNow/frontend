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
  preferred_contact: string;
  property_type: string;
  notes: string;
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

export default function ClientPage() {
  const { t } = useLanguage();

  const [profile, setProfile] = useState<ClientProfile>({
    full_name: '',
    phone: '',
    city: '',
    address: '',
    bio: '',
    preferred_contact: '',
    property_type: '',
    notes: '',
  });
  const [profileLoaded, setProfileLoaded] = useState(false);

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatSending, setChatSending] = useState(false);
  const [conversationID, setConversationID] = useState<string | null>(null);

  const chatBoxRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch(`${API}/v1/client/profile`, { credentials: 'include' })
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data: ClientProfile) => {
        setProfile({
          full_name: data.full_name || '',
          phone: data.phone || '',
          city: data.city || '',
          address: data.address || '',
          bio: data.bio || '',
          preferred_contact: data.preferred_contact || '',
          property_type: data.property_type || '',
          notes: data.notes || '',
        });
        setProfileLoaded(true);
      })
      .catch(err => {
        console.error('[Client] Failed to load profile:', err);
        setProfileLoaded(true);
      });
  }, []);

  useEffect(() => {
    if (!chatSending && inputRef.current) {
      inputRef.current.focus();
    }
  }, [chatSending]);

  const loadLatestConversation = async () => {
    try {
      const r = await fetch(`${API}/v1/conversations?type=client&limit=1`);
      if (!r.ok) return;
      const data = await r.json();
      const convs = data.conversations || [];
      if (convs.length === 0) return;
      const latest = convs[0];
      setConversationID(latest.id);
      const r2 = await fetch(`${API}/v1/conversations/${latest.id}`);
      if (!r2.ok) return;
      const data2 = await r2.json();
      if (data2.messages && Array.isArray(data2.messages)) {
        setChatMessages(data2.messages.map((m: any) => ({
          role: m.role,
          content: m.content,
        })));
      }
    } catch (err) {
      console.error('[Client] Failed to load latest conversation:', err);
    }
  };

  useEffect(() => {
    loadLatestConversation();
  }, []);

  const applyDetectedFields = (rawFields: Partial<ClientProfile> | string) => {
    try {
      const fields = typeof rawFields === 'string' ? JSON.parse(rawFields) : rawFields;
      setProfile(prev => {
        const merged = { ...prev };
        for (const [key, value] of Object.entries(fields)) {
          if (value !== undefined && value !== null && key in merged) {
            (merged as any)[key] = value;
          }
        }
        return merged;
      });
      // Re-fetch from backend to confirm save
      fetch(`${API}/v1/client/profile`, { credentials: 'include' })
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          if (data && data.user_id) {
            setProfile(p => ({
              full_name: data.full_name || '',
              phone: data.phone || '',
              city: data.city || '',
              address: data.address || '',
              bio: data.bio || '',
              preferred_contact: data.preferred_contact || '',
              property_type: data.property_type || '',
              notes: data.notes || '',
            }));
          }
        })
        .catch(() => {});
    } catch (parseErr) {
      console.warn('[Client] failed to parse detected_fields', parseErr);
    }
  };

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

      if (data.detected_fields) {
        applyDetectedFields(data.detected_fields);
      }

      if (data.conversation_id) {
        setConversationID(data.conversation_id);
      }
    } catch {
      setChatMessages(prev => [...prev, { role: 'assistant', content: t('client.chat.error') }]);
    } finally {
      setChatSending(false);
    }
  };

  const handleChatKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleResetProfile = async () => {
    if (!confirm(t('client.card.reset.confirm'))) return;
    try {
      await fetch(`${API}/v1/client/profile`, { method: 'DELETE', credentials: 'include' });
      setProfile({
        full_name: '', phone: '', city: '', address: '', bio: '',
        preferred_contact: '', property_type: '', notes: '',
      });
    } catch (e) {
      console.error('[Client] failed to reset profile', e);
    }
  };

  const handleResetRole = async () => {
    try {
      await fetch(`${API}/v1/user/reset-role`, { method: 'POST' });
    } catch { /* ignore */ }
    route('/', true);
  };

  const handleLogout = async () => {
    if (!confirm(t('auth.logout.confirm'))) return;
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch { /* ignore */ }
    route('/login', true);
  };

  const fmt = (v: string | number | boolean | undefined | null) => {
    if (v === undefined || v === null || v === '') return <span class="profile-empty">—</span>;
    if (typeof v === 'boolean') return <span class={v ? 'profile-bool-yes' : 'profile-bool-no'}>{v ? '✓' : '✗'}</span>;
    return <>{v}</>;
  };

  if (!profileLoaded) {
    return <div class="page"><div class="loading"><p>{t('client.loading')}</p></div></div>;
  }

  return (
    <div class="page">
      <div class="page-header">
        <h2>{t('client.title')}</h2>
        <div class="header-right">
          <LangToggle />
          <span class="user-email"></span>
          <button class="btn btn-ghost btn-sm" onClick={() => route('/', true)}>{t('nav.back')}</button>
          <button class="btn btn-danger btn-sm" onClick={handleLogout}>{t('auth.logout')}</button>
          <button class="btn btn-danger btn-sm" onClick={handleResetRole}>{t('client.reset.role')}</button>
        </div>
      </div>

      <div class="page-content">
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

          {/* Read-only Profile Card */}
          <div class="col-form">
            <div class="profile-card">
              {/* Personal Information */}
              <div class="section">
                <h3 class="section-title">{t('client.card.personal')}</h3>
                <div class="profile-field">
                  <span class="profile-label">{t('client.card.full_name')}</span>
                  <span class="profile-value">{fmt(profile.full_name)}</span>
                </div>
                <div class="profile-field">
                  <span class="profile-label">{t('client.card.phone')}</span>
                  <span class="profile-value">{fmt(profile.phone)}</span>
                </div>
                <div class="profile-field">
                  <span class="profile-label">{t('client.card.preferred_contact')}</span>
                  <span class="profile-value">{fmt(profile.preferred_contact)}</span>
                </div>
              </div>

              {/* Location */}
              <div class="section">
                <h3 class="section-title">{t('client.card.location')}</h3>
                <div class="profile-field">
                  <span class="profile-label">{t('client.card.city')}</span>
                  <span class="profile-value">{fmt(profile.city)}</span>
                </div>
                <div class="profile-field">
                  <span class="profile-label">{t('client.card.address')}</span>
                  <span class="profile-value">{fmt(profile.address)}</span>
                </div>
                <div class="profile-field">
                  <span class="profile-label">{t('client.card.property_type')}</span>
                  <span class="profile-value">{fmt(profile.property_type)}</span>
                </div>
              </div>

              {/* About */}
              <div class="section">
                <h3 class="section-title">{t('client.card.about')}</h3>
                <div class="profile-field">
                  <span class="profile-label">{t('client.card.bio')}</span>
                  <span class="profile-value">{fmt(profile.bio)}</span>
                </div>
                <div class="profile-field">
                  <span class="profile-label">{t('client.card.notes')}</span>
                  <span class="profile-value">{fmt(profile.notes)}</span>
                </div>
              </div>
            </div>

            <button class="btn btn-ghost btn-sm card-reset" onClick={handleResetProfile}>{t('client.card.reset')}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
