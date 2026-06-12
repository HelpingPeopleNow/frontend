import { h } from 'preact';
import { route } from 'preact-router';
import { useState, useEffect, useRef } from 'preact/hooks';
import { useAuth } from './AuthProvider';
import { useLanguage, LangToggle } from './i18n';

interface SocialLink {
  platform: string;
  url: string;
}

interface WorkerProfile {
  user_id: string;
  profession: string;
  business_name: string;
  bio: string;
  phone: string;
  city: string;
  service_radius_km: number;
  address: string;
  hourly_rate: number;
  minimum_charge: number;
  free_estimate: boolean;
  years_experience: number;
  certifications: string[];
  has_insurance: boolean;
  languages: string[];
  emergency_service: boolean;
  website: string;
  social_links: SocialLink[];
}

interface ChatMsg {
  role: 'user' | 'assistant';
  content: string;
}

export default function WorkerPage() {
  const { session, logout, refreshSession } = useAuth();
  const { t } = useLanguage();
  const [profile, setProfile] = useState<WorkerProfile>({
    user_id: '', profession: '', business_name: '', bio: '', phone: '',
    city: '', service_radius_km: 25, address: '', hourly_rate: 0, minimum_charge: 0,
    free_estimate: true, years_experience: 0, certifications: [], has_insurance: false,
    languages: [], emergency_service: false, website: '', social_links: [],
  });
  const [loading, setLoading] = useState(true);

  // Chat state
  const [chatMsgs, setChatMsgs] = useState<ChatMsg[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatSending, setChatSending] = useState(false);
  const [chatConvId, setChatConvId] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/v1/worker/profile', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          if (data && data.user_id) {
            setProfile(p => ({
              ...p, ...data,
              certifications: data.certifications || [],
              languages: data.languages || [],
              social_links: data.social_links || [],
            }));
          }
        }
      } catch (e) {
        // Profile might not exist yet
      }

      // Load last worker conversation for chat panel
      try {
        const convRes = await fetch('/api/v1/conversations?type=worker&limit=1', { credentials: 'include' });
        if (convRes.ok) {
          const convData = await convRes.json();
          if (convData.conversations && convData.conversations.length > 0) {
            const conv = convData.conversations[0];
            const updated = new Date(conv.updated_at).getTime();
            if (Date.now() - updated < 24 * 60 * 60 * 1000) {
              const detailRes = await fetch(`/api/v1/conversations/${conv.id}`, { credentials: 'include' });
              if (detailRes.ok) {
                const detail = await detailRes.json();
                if (detail.messages && Array.isArray(detail.messages)) {
                  const loaded = detail.messages.map((m: any) => ({
                    role: m.role as 'user' | 'assistant',
                    content: m.content,
                  }));
                  setChatMsgs(loaded);
                  setChatConvId(detail.id);
                }
              }
            }
          }
        }
      } catch (convErr) {
        console.log('[worker] could not load previous conversation', convErr);
      }
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (!loading) {
      chatInputRef.current?.focus();
    }
  }, [loading]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMsgs]);

  useEffect(() => {
    if (!chatSending && !loading) {
      chatInputRef.current?.focus();
    }
  }, [chatSending, loading]);

  const applyDetectedFields = (rawFields: Record<string, any> | string) => {
    try {
      const fields: Record<string, any> = typeof rawFields === 'string'
        ? JSON.parse(rawFields)
        : rawFields;

      const fieldMap: Record<string, keyof WorkerProfile> = {
        profession: 'profession', business_name: 'business_name', bio: 'bio', phone: 'phone',
        city: 'city', address: 'address', hourly_rate: 'hourly_rate', minimum_charge: 'minimum_charge',
        years_experience: 'years_experience', website: 'website',
      };

      setProfile(prev => {
        const updated = { ...prev };
        for (const [key, target] of Object.entries(fieldMap)) {
          if (fields[key] !== undefined && fields[key] !== null) {
            (updated as any)[target] = fields[key];
          }
        }
        // Social links — merge from individual social fields + social_links array
        const existingLinks = [...(prev.social_links || [])];
        const knownPlatforms = existingLinks.map(s => s.platform.toLowerCase());
        const socialPlatforms: Record<string, string> = {
          instagram: 'Instagram', facebook: 'Facebook', twitter: 'Twitter',
          linkedin: 'LinkedIn', tiktok: 'TikTok', youtube: 'YouTube',
        };
        for (const [key, label] of Object.entries(socialPlatforms)) {
          if (fields[key] !== undefined && fields[key] !== null && fields[key] !== '') {
            if (!knownPlatforms.includes(key)) {
              existingLinks.push({ platform: label, url: fields[key] });
              knownPlatforms.push(key);
            }
          }
        }
        if (fields.social_links && Array.isArray(fields.social_links)) {
          for (const item of fields.social_links) {
            if (item.platform && item.url) {
              if (!knownPlatforms.includes(item.platform.toLowerCase())) {
                existingLinks.push({ platform: item.platform, url: item.url });
                knownPlatforms.push(item.platform.toLowerCase());
              }
            }
          }
        }
        updated.social_links = existingLinks;
        // Boolean fields
        if (fields.free_estimate !== undefined) updated.free_estimate = Boolean(fields.free_estimate);
        if (fields.has_insurance !== undefined) updated.has_insurance = Boolean(fields.has_insurance);
        if (fields.emergency_service !== undefined) updated.emergency_service = Boolean(fields.emergency_service);
        // Number fields
        if (fields.service_radius_km !== undefined) updated.service_radius_km = Number(fields.service_radius_km) || 0;
        if (fields.hourly_rate !== undefined) updated.hourly_rate = Number(fields.hourly_rate) || 0;
        if (fields.minimum_charge !== undefined) updated.minimum_charge = Number(fields.minimum_charge) || 0;
        if (fields.years_experience !== undefined) updated.years_experience = Number(fields.years_experience) || 0;
        // Array fields
        if (Array.isArray(fields.languages)) updated.languages = fields.languages;
        if (Array.isArray(fields.certifications)) updated.certifications = fields.certifications;
        return updated;
      });

      // Re-fetch from backend to confirm save
      fetch('/api/v1/worker/profile', { credentials: 'include' })
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          if (data && data.user_id) {
            setProfile(p => ({
              ...p, ...data,
              certifications: data.certifications || [],
              languages: data.languages || [],
              social_links: data.social_links || [],
            }));
          }
        })
        .catch(() => {});
    } catch (parseErr) {
      console.warn('[worker-chat] failed to parse detected_fields', parseErr);
    }
  };

  const sendChatMessage = async () => {
    const msg = chatInput.trim();
    if (!msg || chatSending) return;
    setChatInput('');
    setChatSending(true);

    const newMsgs: ChatMsg[] = [...chatMsgs, { role: 'user', content: msg }];
    setChatMsgs(newMsgs);

    try {
      const history = chatMsgs.map(m => ({ role: m.role, content: m.content }));

      const res = await fetch('/api/v1/worker/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          message: msg,
          history,
          conversation_id: chatConvId || undefined,
        }),
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({ error: 'unknown error' }));
        setChatMsgs([...newMsgs, { role: 'assistant', content: `Error: ${errBody.error || res.status}` }]);
        setChatSending(false);
        return;
      }

      const data = await res.json();
      if (data.detected_fields) {
        applyDetectedFields(data.detected_fields);
      }

      setChatMsgs([...newMsgs, { role: 'assistant', content: data.answer || t('worker.chat.empty') }]);
      if (data.conversation_id) {
        setChatConvId(data.conversation_id);
      }
    } catch (e: any) {
      setChatMsgs([...newMsgs, { role: 'assistant', content: t('worker.chat.error') }]);
    } finally {
      setChatSending(false);
    }
  };

  const handleChatKeyDown = (e: h.JSX.TargetedKeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') sendChatMessage();
  };

  const handleResetProfile = async () => {
    if (!confirm(t('worker.card.reset.confirm'))) return;
    try {
      await fetch('/api/v1/worker/profile', { method: 'DELETE', credentials: 'include' });
      setProfile({
        user_id: '', profession: '', business_name: '', bio: '', phone: '',
        city: '', service_radius_km: 25, address: '', hourly_rate: 0, minimum_charge: 0,
        free_estimate: true, years_experience: 0, certifications: [], has_insurance: false,
        languages: [], emergency_service: false, website: '', social_links: [],
      });
    } catch (e) {
      console.error('[worker] failed to reset profile', e);
    }
  };

  const handleLogout = async () => {
    if (!confirm(t('auth.logout.confirm'))) return;
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
      if (!res.ok) return;
      await refreshSession();
      route('/', true);
    } catch (e) {
      console.error('[Worker] failed to reset role', e);
    }
  };

  const fmt = (v: string | number | boolean | undefined | null, suffix?: string) => {
    if (v === undefined || v === null || v === '') return <span class="profile-empty">—</span>;
    if (typeof v === 'boolean') return <span class={v ? 'profile-bool-yes' : 'profile-bool-no'}>{v ? '✓' : '✗'}</span>;
    if (typeof v === 'number' && v === 0) return <span class="profile-empty">—</span>;
    return <>{suffix ? `${v}${suffix}` : v}</>;
  };

  if (loading) {
    return (
      <div class="page">
        <div class="page-content loading">
          <p>{t('worker.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div class="page">
      <div class="page-header">
        <h2>{t('worker.title')}</h2>
        <div class="header-right">
          <LangToggle />
          <span class="user-email">{session?.user?.email}</span>
          <button class="btn btn-ghost btn-sm" onClick={() => route('/', true)}>{t('nav.chat')}</button>
          <button class="btn btn-danger btn-sm" onClick={handleResetRole}>{t('worker.reset.role')}</button>
          <button class="btn btn-danger btn-sm" onClick={handleLogout}>{t('auth.logout')}</button>
        </div>
      </div>

      <div class="page-content">
        <div class="two-col">
          {/* --- Left: Chat Panel --- */}
          <div class="col-chat">
            <h3 class="section-title">{t('worker.chat.title')}</h3>
            <div class="chat-box">
              {chatMsgs.length === 0 && (
                <div class="chat-welcome">
                  <p>{t('worker.chat.welcome')}</p>
                  <p>{t('worker.chat.example')} <em>{t('worker.chat.example.text')}</em></p>
                </div>
              )}
              {chatMsgs.map((m, i) => (
                <div key={i} class={`chat-bubble ${m.role === 'user' ? 'chat-user' : 'chat-assistant'}`}>
                  <div class="chat-role-label">{m.role === 'user' ? t('worker.chat.you') : t('worker.chat.assistant')}</div>
                  <div class="chat-content">{m.content}</div>
                </div>
              ))}
              {chatSending && <div class="chat-bubble chat-assistant"><div class="chat-role-label">{t('worker.chat.assistant')}</div><div class="chat-content"><em>{t('worker.chat.typing')}</em></div></div>}
              <div ref={chatEndRef} />
            </div>
            <div class="chat-input-row">
              <input
                class="input"
                type="text"
                value={chatInput}
                onInput={e => setChatInput((e.target as HTMLInputElement).value)}
                onKeyDown={handleChatKeyDown}
                placeholder={chatMsgs.length === 0 ? t('worker.chat.placeholder.start') : t('worker.chat.placeholder.answer')}
                disabled={chatSending}
                ref={chatInputRef}
              />
              <button class="btn-send" onClick={sendChatMessage} disabled={chatSending || !chatInput.trim()}>
                {chatSending ? '…' : t('worker.chat.send')}
              </button>
            </div>
          </div>

          {/* --- Right: Read-only Profile Card --- */}
          <div class="col-form">
            <div class="profile-card">
              {/* Core Identity */}
              <div class="section">
                <h3 class="section-title">{t('worker.card.core')}</h3>
                <div class="profile-field">
                  <span class="profile-label">{t('worker.card.profession')}</span>
                  <span class="profile-value">{fmt(profile.profession)}</span>
                </div>
                <div class="profile-field">
                  <span class="profile-label">{t('worker.card.business_name')}</span>
                  <span class="profile-value">{fmt(profile.business_name)}</span>
                </div>
                <div class="profile-field">
                  <span class="profile-label">{t('worker.card.bio')}</span>
                  <span class="profile-value">{fmt(profile.bio)}</span>
                </div>
                <div class="profile-field">
                  <span class="profile-label">{t('worker.card.phone')}</span>
                  <span class="profile-value">{fmt(profile.phone)}</span>
                </div>
              </div>

              {/* Location & Area */}
              <div class="section">
                <h3 class="section-title">{t('worker.card.location')}</h3>
                <div class="profile-field">
                  <span class="profile-label">{t('worker.card.city')}</span>
                  <span class="profile-value">{fmt(profile.city)}</span>
                </div>
                <div class="profile-field">
                  <span class="profile-label">{t('worker.card.radius')}</span>
                  <span class="profile-value">{fmt(profile.service_radius_km, ' km')}</span>
                </div>
                <div class="profile-field">
                  <span class="profile-label">{t('worker.card.address')}</span>
                  <span class="profile-value">{fmt(profile.address)}</span>
                </div>
              </div>

              {/* Pricing */}
              <div class="section">
                <h3 class="section-title">{t('worker.card.pricing')}</h3>
                <div class="profile-field">
                  <span class="profile-label">{t('worker.card.hourly')}</span>
                  <span class="profile-value">{fmt(profile.hourly_rate, '€')}</span>
                </div>
                <div class="profile-field">
                  <span class="profile-label">{t('worker.card.minimum')}</span>
                  <span class="profile-value">{fmt(profile.minimum_charge, '€')}</span>
                </div>
                <div class="profile-field">
                  <span class="profile-label">{t('worker.card.free_estimate')}</span>
                  <span class="profile-value">{fmt(profile.free_estimate)}</span>
                </div>
              </div>

              {/* Credentials */}
              <div class="section">
                <h3 class="section-title">{t('worker.card.credentials')}</h3>
                <div class="profile-field">
                  <span class="profile-label">{t('worker.card.experience')}</span>
                  <span class="profile-value">{fmt(profile.years_experience, ' years')}</span>
                </div>
                <div class="profile-field">
                  <span class="profile-label">{t('worker.card.certifications')}</span>
                  <span class="profile-value">
                    {profile.certifications.length > 0
                      ? <span class="profile-tags">{profile.certifications.map(c => <span class="profile-tag">{c}</span>)}</span>
                      : <span class="profile-empty">—</span>}
                  </span>
                </div>
                <div class="profile-field">
                  <span class="profile-label">{t('worker.card.insurance')}</span>
                  <span class="profile-value">{fmt(profile.has_insurance)}</span>
                </div>
                <div class="profile-field">
                  <span class="profile-label">{t('worker.card.languages')}</span>
                  <span class="profile-value">
                    {profile.languages.length > 0
                      ? <span class="profile-tags">{profile.languages.map(l => <span class="profile-tag">{l}</span>)}</span>
                      : <span class="profile-empty">—</span>}
                  </span>
                </div>
                <div class="profile-field">
                  <span class="profile-label">{t('worker.card.emergency')}</span>
                  <span class="profile-value">{fmt(profile.emergency_service)}</span>
                </div>
              </div>

              {/* Online Presence */}
              <div class="section">
                <h3 class="section-title">{t('worker.card.online')}</h3>
                <div class="profile-field">
                  <span class="profile-label">{t('worker.card.website')}</span>
                  <span class="profile-value">{fmt(profile.website)}</span>
                </div>
                <div class="profile-field">
                  <span class="profile-label">{t('worker.card.social')}</span>
                  <span class="profile-value">
                    {profile.social_links.length > 0
                      ? <span class="profile-tags">{profile.social_links.map(s => <span class="profile-tag">{s.platform}: {s.url}</span>)}</span>
                      : <span class="profile-empty">—</span>}
                  </span>
                </div>
              </div>
            </div>

            <button class="btn btn-ghost btn-sm card-reset" onClick={handleResetProfile}>{t('worker.card.reset')}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
