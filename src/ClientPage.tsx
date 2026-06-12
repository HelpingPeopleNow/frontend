import { h } from 'preact';
import { useState, useEffect, useRef } from 'preact/hooks';
import { route } from 'preact-router';
import { useLanguage } from './i18n';
import AppShell from './AppShell';

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

interface WorkerCard {
  id: number;
  profession: string;
  business_name: string;
  bio: string;
  city: string;
  hourly_rate: number;
  free_estimate: boolean;
  years_experience: number;
  certifications: string[];
  has_insurance: boolean;
  emergency_service: boolean;
}

interface FindChatMessage {
  role: 'user' | 'assistant';
  content: string;
  workers?: WorkerCard[];
}

interface FindChatResponse {
  answer: string;
  workers?: WorkerCard[];
  conversation_id?: string;
}

export default function ClientPage() {
  const { t } = useLanguage();
  const [profile, setProfile] = useState<ClientProfile>({
    full_name: '', phone: '', city: '', address: '', bio: '',
    preferred_contact: '', property_type: '', notes: '',
  });
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatSending, setChatSending] = useState(false);
  const [conversationID, setConversationID] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'profile' | 'find'>('profile');
  const [findMessages, setFindMessages] = useState<FindChatMessage[]>([]);
  const [findInput, setFindInput] = useState('');
  const [findSending, setFindSending] = useState(false);
  const [findConvId, setFindConvId] = useState<string | null>(null);
  const chatBoxRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch(`${API}/v1/client/profile`, { credentials: 'include' })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then((data: ClientProfile) => {
        setProfile({
          full_name: data.full_name || '', phone: data.phone || '', city: data.city || '',
          address: data.address || '', bio: data.bio || '', preferred_contact: data.preferred_contact || '',
          property_type: data.property_type || '', notes: data.notes || '',
        });
        setProfileLoaded(true);
      })
      .catch(() => setProfileLoaded(true));
  }, []);

  useEffect(() => {
    if (!chatSending && inputRef.current && activeTab === 'profile') inputRef.current.focus();
    if (!findSending && inputRef.current && activeTab === 'find') inputRef.current.focus();
  }, [chatSending, findSending, activeTab]);

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
        setChatMessages(data2.messages.map((m: any) => ({ role: m.role, content: m.content })));
      }
    } catch {}
  };

  const loadLatestFindConversation = async () => {
    try {
      const r = await fetch(`${API}/v1/conversations?type=client-find&limit=1`);
      if (!r.ok) return;
      const data = await r.json();
      const convs = data.conversations || [];
      if (convs.length === 0) return;
      const latest = convs[0];
      setFindConvId(latest.id);
      const r2 = await fetch(`${API}/v1/conversations/${latest.id}`);
      if (!r2.ok) return;
      const data2 = await r2.json();
      if (data2.messages && Array.isArray(data2.messages)) {
        setFindMessages(data2.messages.map((m: any) => ({ role: m.role, content: m.content })));
      }
    } catch {}
  };

  useEffect(() => { loadLatestConversation(); loadLatestFindConversation(); }, []);

  const applyDetectedFields = (rawFields: Partial<ClientProfile> | string) => {
    try {
      const fields = typeof rawFields === 'string' ? JSON.parse(rawFields) : rawFields;
      setProfile(prev => {
        const merged = { ...prev };
        for (const [key, value] of Object.entries(fields)) {
          if (value !== undefined && value !== null && key in merged) (merged as any)[key] = value;
        }
        return merged;
      });
      fetch(`${API}/v1/client/profile`, { credentials: 'include' })
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          if (data && data.user_id) {
            setProfile({
              full_name: data.full_name || '', phone: data.phone || '', city: data.city || '',
              address: data.address || '', bio: data.bio || '', preferred_contact: data.preferred_contact || '',
              property_type: data.property_type || '', notes: data.notes || '',
            });
          }
        })
        .catch(() => {});
    } catch {}
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
      setChatMessages(prev => [...prev, { role: 'assistant', content: data.answer || t('client.chat.empty') }]);
      if (data.detected_fields) applyDetectedFields(data.detected_fields);
      if (data.conversation_id) setConversationID(data.conversation_id);
    } catch {
      setChatMessages(prev => [...prev, { role: 'assistant', content: t('client.chat.error') }]);
    } finally {
      setChatSending(false);
    }
  };

  const sendFindMessage = async () => {
    const msgText = findInput.trim();
    if (!msgText || findSending) return;
    setFindSending(true);
    setFindInput('');
    const userMsg: FindChatMessage = { role: 'user', content: msgText };
    setFindMessages(prev => [...prev, userMsg]);

    try {
      const res = await fetch(`${API}/v1/client/find-chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: msgText,
          history: findMessages.map(({ role, content }) => ({ role, content })),
          conversation_id: findConvId,
        }),
      });
      if (!res.ok) {
        setFindMessages(prev => [...prev, { role: 'assistant', content: t('client.find.error') }]);
        return;
      }
      const data: FindChatResponse = await res.json();
      setFindMessages(prev => [...prev, { role: 'assistant', content: data.answer || t('client.find.empty'), workers: data.workers }]);
      if (data.conversation_id) setFindConvId(data.conversation_id);
    } catch {
      setFindMessages(prev => [...prev, { role: 'assistant', content: t('client.find.error') }]);
    } finally {
      setFindSending(false);
    }
  };

  const handleResetProfile = async () => {
    if (!confirm(t('client.card.reset.confirm'))) return;
    try {
      await fetch(`${API}/v1/client/profile`, { method: 'DELETE', credentials: 'include' });
      setProfile({ full_name: '', phone: '', city: '', address: '', bio: '', preferred_contact: '', property_type: '', notes: '' });
    } catch {}
  };

  const handleResetRole = async () => {
    try { await fetch(`${API}/v1/user/reset-role`, { method: 'POST' }); } catch {}
    route('/', true);
  };

  const fmt = (v: string | number | boolean | undefined | null) => {
    if (v === undefined || v === null || v === '') return <span class="profile-empty">—</span>;
    if (typeof v === 'boolean') return <span class={v ? 'profile-bool-yes' : 'profile-bool-no'}>{v ? '✓' : '✗'}</span>;
    return <>{v}</>;
  };

  if (!profileLoaded) {
    return <AppShell currentPath="/client" title={t('client.title')}><div class="loading"><div class="spinner" /> {t('client.loading')}</div></AppShell>;
  }

  return (
    <AppShell currentPath="/client" title={t('client.title')}>
      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 'var(--sp-1)', marginBottom: 'var(--sp-5)', background: 'var(--surface)', padding: '4px', borderRadius: 'var(--r-md)', border: '1px solid var(--border)' }}>
        <button
          onClick={() => setActiveTab('profile')}
          style={{
            flex: 1, padding: '10px', borderRadius: 'var(--r-sm)', border: 'none', fontFamily: 'inherit',
            fontSize: 'var(--text-sm)', fontWeight: 600, cursor: 'pointer', transition: 'all 150ms ease',
            background: activeTab === 'profile' ? 'var(--primary-subtle)' : 'transparent',
            color: activeTab === 'profile' ? 'var(--primary-hover)' : 'var(--text-muted)',
          }}
        >
          {t('client.tab.profile')}
        </button>
        <button
          onClick={() => setActiveTab('find')}
          style={{
            flex: 1, padding: '10px', borderRadius: 'var(--r-sm)', border: 'none', fontFamily: 'inherit',
            fontSize: 'var(--text-sm)', fontWeight: 600, cursor: 'pointer', transition: 'all 150ms ease',
            background: activeTab === 'find' ? 'var(--primary-subtle)' : 'transparent',
            color: activeTab === 'find' ? 'var(--primary-hover)' : 'var(--text-muted)',
          }}
        >
          {t('client.tab.find')}
        </button>
      </div>

      {activeTab === 'profile' && (
        <div class="two-col">
          {/* Chat Column */}
          <div class="two-col-chat">
            <div class="section-title" style={{ marginBottom: 'var(--sp-3)' }}>{t('client.chat.title')}</div>
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden' }}>
              <div class="chat-messages" ref={chatBoxRef} style={{ padding: 'var(--sp-4)' }}>
                {chatMessages.length === 0 && (
                  <div class="chat-welcome" style={{ padding: 'var(--sp-6)' }}>
                    <p>{t('client.chat.welcome')}</p>
                    <p style={{ marginTop: 'var(--sp-2)', color: 'var(--text-muted)', fontSize: 'var(--text-xs)' }}>
                      {t('client.chat.example')} <em>{t('client.chat.example.text')}</em>
                    </p>
                  </div>
                )}
                {chatMessages.map((m, i) => (
                  <div key={i} class={`chat-bubble ${m.role === 'user' ? 'chat-bubble-user' : 'chat-bubble-assistant'}`}>
                    {m.role === 'assistant' && <div class="chat-role-label">{t('client.chat.assistant')}</div>}
                    <div class="chat-content">{m.content}</div>
                  </div>
                ))}
                {chatSending && (
                  <div class="chat-bubble chat-bubble-assistant">
                    <div class="chat-role-label">{t('client.chat.assistant')}</div>
                    <div class="chat-typing"><span class="chat-typing-dot" /><span class="chat-typing-dot" /><span class="chat-typing-dot" /></div>
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: 'var(--sp-2)', padding: 'var(--sp-3)', borderTop: '1px solid var(--border)' }}>
                <input
                  ref={inputRef} class="input" type="text" value={chatInput}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                  onInput={e => setChatInput(e.currentTarget.value)}
                  placeholder={chatMessages.length === 0 ? t('client.chat.placeholder.start') : t('client.chat.placeholder.answer')}
                  disabled={chatSending}
                />
                <button class="chat-send-btn" onClick={sendMessage} disabled={chatSending || !chatInput.trim()}>
                  {chatSending ? '...' : '↑'}
                </button>
              </div>
            </div>
          </div>

          {/* Profile Card */}
          <div class="two-col-profile">
            <div class="profile-card">
              <div class="profile-section">
                <div class="profile-section-header">
                  <span class="profile-section-icon">👤</span>
                  <span class="profile-section-title">{t('client.card.personal')}</span>
                </div>
                <div class="profile-fields">
                  <div class="profile-field"><span class="profile-label">{t('client.card.full_name')}</span><span class="profile-value">{fmt(profile.full_name)}</span></div>
                  <div class="profile-field"><span class="profile-label">{t('client.card.phone')}</span><span class="profile-value">{fmt(profile.phone)}</span></div>
                  <div class="profile-field"><span class="profile-label">{t('client.card.preferred_contact')}</span><span class="profile-value">{fmt(profile.preferred_contact)}</span></div>
                </div>
              </div>

              <div class="profile-section">
                <div class="profile-section-header">
                  <span class="profile-section-icon">📍</span>
                  <span class="profile-section-title">{t('client.card.location')}</span>
                </div>
                <div class="profile-fields">
                  <div class="profile-field"><span class="profile-label">{t('client.card.city')}</span><span class="profile-value">{fmt(profile.city)}</span></div>
                  <div class="profile-field"><span class="profile-label">{t('client.card.address')}</span><span class="profile-value">{fmt(profile.address)}</span></div>
                  <div class="profile-field"><span class="profile-label">{t('client.card.property_type')}</span><span class="profile-value">{fmt(profile.property_type)}</span></div>
                </div>
              </div>

              <div class="profile-section">
                <div class="profile-section-header">
                  <span class="profile-section-icon">📝</span>
                  <span class="profile-section-title">{t('client.card.about')}</span>
                </div>
                <div class="profile-fields">
                  <div class="profile-field"><span class="profile-label">{t('client.card.bio')}</span><span class="profile-value">{fmt(profile.bio)}</span></div>
                  <div class="profile-field"><span class="profile-label">{t('client.card.notes')}</span><span class="profile-value">{fmt(profile.notes)}</span></div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 'var(--sp-2)', marginTop: 'var(--sp-4)' }}>
              <button class="btn btn-ghost btn-sm" onClick={handleResetProfile} style={{ flex: 1 }}>{t('client.card.reset')}</button>
              <button class="btn btn-danger btn-sm" onClick={handleResetRole} style={{ flex: 1 }}>{t('client.reset.role')}</button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'find' && (
        <div class="two-col-chat" style={{ maxWidth: '700px' }}>
          <div class="section-title" style={{ marginBottom: 'var(--sp-3)' }}>{t('client.find.title')}</div>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden' }}>
            <div class="chat-messages" ref={chatBoxRef} style={{ padding: 'var(--sp-4)' }}>
              {findMessages.length === 0 && (
                <div class="chat-welcome" style={{ padding: 'var(--sp-6)' }}>
                  <div class="chat-welcome-icon">🔍</div>
                  <h3>{t('client.find.title')}</h3>
                  <p>{t('client.find.welcome')}</p>
                </div>
              )}
              {findMessages.map((m, i) => (
                <div key={i} class={`chat-bubble ${m.role === 'user' ? 'chat-bubble-user' : 'chat-bubble-assistant'}`}>
                  {m.role === 'assistant' && <div class="chat-role-label">{t('client.find.assistant')}</div>}
                  <div class="chat-content">{m.content}</div>
                  {m.workers && m.workers.length > 0 && (
                    <div class="worker-card-grid" style={{ marginTop: 'var(--sp-3)' }}>
                      {m.workers.map(w => (
                        <div key={w.id} class="worker-card">
                          <div class="worker-card-header">
                            <span class="worker-card-name">{w.business_name || w.profession}</span>
                            <span class="worker-card-rate">€{w.hourly_rate}/hr</span>
                          </div>
                          <div class="worker-card-meta">
                            {w.profession} · {w.city} · {w.years_experience} years exp.
                          </div>
                          {w.bio && <div class="worker-card-bio">{w.bio}</div>}
                          <div class="worker-card-badges">
                            {w.has_insurance && <span class="worker-badge worker-badge-insured">✓ {t('client.find.badge.insured')}</span>}
                            {w.emergency_service && <span class="worker-badge worker-badge-emergency">⚡ {t('client.find.badge.emergency')}</span>}
                            {w.free_estimate && <span class="worker-badge worker-badge-estimate">📋 {t('client.find.badge.free_estimate')}</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {m.workers && m.workers.length === 0 && (
                    <div class="worker-card-empty">{t('client.find.no_results')}</div>
                  )}
                </div>
              ))}
              {findSending && (
                <div class="chat-bubble chat-bubble-assistant">
                  <div class="chat-role-label">{t('client.find.assistant')}</div>
                  <div class="chat-typing"><span class="chat-typing-dot" /><span class="chat-typing-dot" /><span class="chat-typing-dot" /></div>
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: 'var(--sp-2)', padding: 'var(--sp-3)', borderTop: '1px solid var(--border)' }}>
              <input
                ref={inputRef} class="input" type="text" value={findInput}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendFindMessage(); } }}
                onInput={e => setFindInput(e.currentTarget.value)}
                placeholder={findMessages.length === 0 ? t('client.find.placeholder') : t('client.find.placeholder.followup')}
                disabled={findSending}
              />
              <button class="chat-send-btn" onClick={sendFindMessage} disabled={findSending || !findInput.trim()}>
                {findSending ? '...' : '↑'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
