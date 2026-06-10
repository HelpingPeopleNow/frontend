import { h } from 'preact';
import { route } from 'preact-router';
import { useState, useEffect, useRef } from 'preact/hooks';
import { useAuth } from './AuthProvider';
import { useLanguage, LangToggle } from './i18n';

const PROFESSIONS = ['plumber', 'electrician', 'cleaner', 'handyman', 'painter', 'carpenter', 'gardener', 'hvac', 'mover', 'other'];

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
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  // Chat state
  const [chatMsgs, setChatMsgs] = useState<ChatMsg[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatSending, setChatSending] = useState(false);
  const [chatConvId, setChatConvId] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLInputElement>(null);

  // Input helpers
  const [certInput, setCertInput] = useState('');
  const [langInput, setLangInput] = useState('');
  const [socialPlat, setSocialPlat] = useState('');
  const [socialUrl, setSocialUrl] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/v1/worker/profile');
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
        } else {
          console.warn('[worker] profile restore failed', res.status);
        }
      } catch (e) {
        // Profile might not exist yet — fine
      }

      // Load last worker conversation for chat panel
      try {
        const convRes = await fetch('/api/v1/conversations?type=worker&limit=1', { credentials: 'include' });
        if (convRes.ok) {
          const convData = await convRes.json();
          if (convData.conversations && convData.conversations.length > 0) {
            const conv = convData.conversations[0];
            const updated = new Date(conv.updated_at).getTime();
            // Only resume if from last 24h
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

                  // Merge extracted fields from metadata into form
                  const extractedFields = detail.metadata?.extracted_fields || detail.metadata?.detected_fields;
                  if (extractedFields) {
                    try {
                      const fields = typeof extractedFields === 'string'
                        ? JSON.parse(extractedFields)
                        : extractedFields;
                      mergeDetectedFields(fields);
                      console.log('[worker] loaded extracted fields from conversation metadata');
                    } catch (parseErr) {
                      console.warn('[worker] failed to parse conversation metadata fields', parseErr);
                    }
                  }
                  console.log('[worker] resumed previous conversation', detail.id, loaded.length, 'messages');
                }
              } else {
                console.warn('[worker] conversation detail restore failed', detailRes.status);
              }
            }
          }
        } else {
          console.warn('[worker] conversation list restore failed', convRes.status);
        }
      } catch (convErr) {
        console.log('[worker] could not load previous conversation', convErr);
      }
      setLoading(false);
    })();
  }, []);

  // Focus chat input after page loads
  useEffect(() => {
    if (!loading) {
      chatInputRef.current?.focus();
    }
  }, [loading]);

  // Scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMsgs]);

  // Focus chat input after sending completes (state has settled)
  useEffect(() => {
    if (!chatSending && !loading) {
      chatInputRef.current?.focus();
    }
  }, [chatSending, loading]);

  const updateField = (field: string, value: any) => {
    setProfile(p => ({ ...p, [field]: value }));
  };

  const addCert = () => {
    const v = certInput.trim();
    if (v && !profile.certifications.includes(v)) {
      updateField('certifications', [...profile.certifications, v]);
    }
    setCertInput('');
  };
  const removeCert = (idx: number) => {
    updateField('certifications', profile.certifications.filter((_, i) => i !== idx));
  };
  const addLang = () => {
    const v = langInput.trim();
    if (v && !profile.languages.includes(v)) {
      updateField('languages', [...profile.languages, v]);
    }
    setLangInput('');
  };
  const removeLang = (idx: number) => {
    updateField('languages', profile.languages.filter((_, i) => i !== idx));
  };
  const addSocial = () => {
    const p = socialPlat.trim();
    const u = socialUrl.trim();
    if (p && u) {
      updateField('social_links', [...profile.social_links, { platform: p, url: u }]);
    }
    setSocialPlat('');
    setSocialUrl('');
  };
  const removeSocial = (idx: number) => {
    updateField('social_links', profile.social_links.filter((_, i) => i !== idx));
  };

  // Merge detected fields from chat into the form
  const mergeDetectedFields = (fields: Record<string, any>) => {
    const updated: Partial<WorkerProfile> = {};
    const fieldMap: Record<string, keyof WorkerProfile> = {
      profession: 'profession', business_name: 'business_name', bio: 'bio', phone: 'phone',
      city: 'city', address: 'address', hourly_rate: 'hourly_rate', minimum_charge: 'minimum_charge',
      years_experience: 'years_experience', website: 'website',
    };
    for (const [key, target] of Object.entries(fieldMap)) {
      if (fields[key] !== undefined && fields[key] !== null && fields[key] !== '') {
        updated[target] = fields[key] as any;
      }
    }

    // Convert individual social fields from LLM into social_links array
    const socialPlatforms: Record<string, string> = {
      instagram: 'Instagram', facebook: 'Facebook', twitter: 'Twitter',
      linkedin: 'LinkedIn', tiktok: 'TikTok', youtube: 'YouTube',
    };
    const existingLinks = [...(profile.social_links || [])];
    const knownPlatforms = existingLinks.map(s => s.platform.toLowerCase());
    for (const [key, label] of Object.entries(socialPlatforms)) {
      if (fields[key] !== undefined && fields[key] !== null && fields[key] !== '') {
        if (!knownPlatforms.includes(key)) {
          existingLinks.push({ platform: label, url: fields[key] });
          knownPlatforms.push(key);
        }
      }
    }
    updated.social_links = existingLinks;
    for (const [key, target] of Object.entries(fieldMap)) {
      if (fields[key] !== undefined && fields[key] !== null && fields[key] !== '') {
        updated[target] = fields[key] as any;
      }
    }
    // Boolean fields
    if (fields.free_estimate !== undefined) updated.free_estimate = Boolean(fields.free_estimate);
    if (fields.has_insurance !== undefined) updated.has_insurance = Boolean(fields.has_insurance);
    if (fields.emergency_service !== undefined) updated.emergency_service = Boolean(fields.emergency_service);
    // Number fields
    if (fields.service_radius_km !== undefined && fields.service_radius_km !== '') updated.service_radius_km = Number(fields.service_radius_km) || 0;
    if (fields.hourly_rate !== undefined && fields.hourly_rate !== '') updated.hourly_rate = Number(fields.hourly_rate) || 0;
    if (fields.minimum_charge !== undefined && fields.minimum_charge !== '') updated.minimum_charge = Number(fields.minimum_charge) || 0;
    if (fields.years_experience !== undefined && fields.years_experience !== '') updated.years_experience = Number(fields.years_experience) || 0;
    // Array fields
    if (Array.isArray(fields.languages)) updated.languages = fields.languages;
    if (Array.isArray(fields.certifications)) updated.certifications = fields.certifications;

    if (Object.keys(updated).length > 0) {
      console.log('[worker-chat] merging fields into form:', updated);
      setProfile(p => ({ ...p, ...updated }));
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
      // Build history from chat messages (excluding the last user message which is the current question)
      const history = chatMsgs.map(m => ({ role: m.role, content: m.content }));

      console.log('[worker-chat] sending to /api/v1/worker/chat', 'msg_len', msg.length, 'history_len', history.length);
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
        console.error('[worker-chat] request failed', res.status, errBody);
        setChatMsgs([...newMsgs, { role: 'assistant', content: `Error: ${errBody.error || res.status}` }]);
        setChatSending(false);
        return;
      }

      const data = await res.json();
      console.log('[worker-chat] response received', 'answer_len', data.answer?.length, 'has_fields', !!data.detected_fields);

      // Merge detected fields into the form
      if (data.detected_fields) {
        try {
          const fields = typeof data.detected_fields === 'string'
            ? JSON.parse(data.detected_fields)
            : data.detected_fields;
          console.log('[worker-chat] detected_fields:', fields);
          mergeDetectedFields(fields);
        } catch (parseErr) {
          console.warn('[worker-chat] failed to parse detected_fields', parseErr);
        }
      }

      setChatMsgs([...newMsgs, { role: 'assistant', content: data.answer || t('worker.chat.empty') }]);
      // Save conversation ID for continued chat
      if (data.conversation_id) {
        setChatConvId(data.conversation_id);
        console.log('[worker-chat] conversation_id:', data.conversation_id);
      }
    } catch (e: any) {
      console.error('[worker-chat] network error', e);
      setChatMsgs([...newMsgs, { role: 'assistant', content: t('worker.chat.error') }]);
    } finally {
      setChatSending(false);
    }
  };

  const handleChatKeyDown = (e: h.JSX.TargetedKeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') sendChatMessage();
  };

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    setError('');
    try {
      console.log('[worker] saving profile', profile.profession, profile.city);
      const res = await fetch('/api/v1/worker/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'unknown error' }));
        throw new Error(err.error || 'save failed');
      }
      const updated = await res.json();
      console.log('[worker] profile saved', updated);
      setProfile(p => ({
        ...p, ...updated,
        certifications: updated.certifications || [],
        languages: updated.languages || [],
        social_links: updated.social_links || [],
      }));
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e: any) {
      setError(e.message || t('worker.save.error'));
      console.error('[worker] save failed', e);
    } finally {
      setSaving(false);
    }
  };

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
        console.error('[Worker] failed to reset role', res.status);
        return;
      }
      await refreshSession();
      route('/', true);
    } catch (e) {
      console.error('[Worker] failed to reset role', e);
    }
  };

  if (loading) {
    return (
      <div class="role-page">
        <div class="role-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p style={{ color: '#888' }}>{t('worker.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div class="role-page">
      <div class="role-header">
        <h2>{t('worker.title')}</h2>
        <div class="header-right">
          <LangToggle />
          <span class="user-email">{session?.user?.email}</span>
          <button class="btn-chat" onClick={() => route('/', true)}>{t('nav.chat')}</button>
          <button class="btn-reset" onClick={handleResetRole}>{t('worker.reset.role')}</button>
          <button class="btn-logout" onClick={handleLogout}>{t('auth.logout')}</button>
        </div>
      </div>

      <div class="role-content">
        {error && <div class="msg msg-error">{error}</div>}
        {saved && <div class="msg msg-success">{t('worker.saved')}</div>}

        <div class="two-col">
          {/* --- Left: Chat Panel --- */}
          <div class="col-chat">
            <h3 class="section-title">{t('worker.chat.title')}</h3>
            <div class="chat-box">
              {chatMsgs.length === 0 && (
                <div class="chat-welcome">
                  <p>{t('worker.chat.welcome')}</p>
                  <p style={{ color: '#888', fontSize: '0.85rem' }}>{t('worker.chat.example')} <em>{t('worker.chat.example.text')}</em></p>
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

          {/* --- Right: Form --- */}
          <div class="col-form">
            {/* Core Identity */}
            <div class="section">
              <h3 class="section-title">{t('worker.form.core')}</h3>

              <label class="field">
                <span>{t('worker.form.profession')}</span>
                <select value={profile.profession} onChange={e => updateField('profession', (e.target as HTMLSelectElement).value)}>
                  <option value="">{t('worker.form.profession.placeholder')}</option>
                  {PROFESSIONS.map(p => <option value={p}>{p}</option>)}
                </select>
              </label>

              <label class="field">
                <span>{t('worker.form.business')}</span>
                <input type="text" value={profile.business_name} onChange={e => updateField('business_name', (e.target as HTMLInputElement).value)} placeholder="Alvaro's Repairs SL" />
              </label>

              <label class="field">
                <span>{t('worker.form.bio')}</span>
                <textarea rows={3} value={profile.bio} onChange={e => updateField('bio', (e.target as HTMLTextAreaElement).value)} placeholder="10 years fixing leaks in Madrid" />
              </label>

              <label class="field">
                <span>{t('worker.form.phone')}</span>
                <input type="tel" value={profile.phone} onChange={e => updateField('phone', (e.target as HTMLInputElement).value)} placeholder="+34 612 345 678" />
              </label>
            </div>

            {/* Location & Service Area */}
            <div class="section">
              <h3 class="section-title">{t('worker.form.location')}</h3>

              <label class="field">
                <span>{t('worker.form.city')}</span>
                <input type="text" value={profile.city} onChange={e => updateField('city', (e.target as HTMLInputElement).value)} placeholder="Madrid" />
              </label>

              <label class="field">
                <span>{t('worker.form.radius')}</span>
                <input type="number" min={0} max={200} value={profile.service_radius_km} onChange={e => updateField('service_radius_km', parseInt((e.target as HTMLInputElement).value) || 0)} />
              </label>

              <label class="field">
                <span>{t('worker.form.address')}</span>
                <input type="text" value={profile.address} onChange={e => updateField('address', (e.target as HTMLInputElement).value)} placeholder="Calle Mayor 10, 28013" />
              </label>
            </div>

            {/* Pricing */}
            <div class="section">
              <h3 class="section-title">{t('worker.form.pricing')}</h3>

              <label class="field">
                <span>{t('worker.form.hourly')}</span>
                <input type="number" min={0} step={0.5} value={profile.hourly_rate || ''} onChange={e => updateField('hourly_rate', parseFloat((e.target as HTMLInputElement).value) || 0)} placeholder="35.00" />
              </label>

              <label class="field">
                <span>{t('worker.form.minimum')}</span>
                <input type="number" min={0} step={0.5} value={profile.minimum_charge || ''} onChange={e => updateField('minimum_charge', parseFloat((e.target as HTMLInputElement).value) || 0)} placeholder="50.00" />
              </label>

              <label class="field field-row">
                <span>{t('worker.form.free.estimate')}</span>
                <input type="checkbox" checked={profile.free_estimate} onChange={e => updateField('free_estimate', (e.target as HTMLInputElement).checked)} />
              </label>
            </div>

            {/* Credentials */}
            <div class="section">
              <h3 class="section-title">{t('worker.form.credentials')}</h3>

              <label class="field">
                <span>{t('worker.form.experience')}</span>
                <input type="number" min={0} max={70} value={profile.years_experience} onChange={e => updateField('years_experience', parseInt((e.target as HTMLInputElement).value) || 0)} />
              </label>

              <div class="field">
                <span>{t('worker.form.certifications')}</span>
                <div class="tag-input-row">
                  <input type="text" value={certInput} onChange={e => setCertInput((e.target as HTMLInputElement).value)} placeholder={t('worker.form.certifications')} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addCert())} />
                  <button class="btn-sm" onClick={addCert}>+</button>
                </div>
                <div class="tags">
                  {profile.certifications.map((c, i) => (
                    <span class="tag">{c} <button class="tag-remove" onClick={() => removeCert(i)}>×</button></span>
                  ))}
                </div>
              </div>

              <label class="field field-row">
                <span>{t('worker.form.insurance')}</span>
                <input type="checkbox" checked={profile.has_insurance} onChange={e => updateField('has_insurance', (e.target as HTMLInputElement).checked)} />
              </label>

              <div class="field">
                <span>{t('worker.form.languages')}</span>
                <div class="tag-input-row">
                  <input type="text" value={langInput} onChange={e => setLangInput((e.target as HTMLInputElement).value)} placeholder={t('worker.form.languages')} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addLang())} />
                  <button class="btn-sm" onClick={addLang}>+</button>
                </div>
                <div class="tags">
                  {profile.languages.map((l, i) => (
                    <span class="tag">{l} <button class="tag-remove" onClick={() => removeLang(i)}>×</button></span>
                  ))}
                </div>
              </div>

              <label class="field field-row">
                <span>{t('worker.form.emergency')}</span>
                <input type="checkbox" checked={profile.emergency_service} onChange={e => updateField('emergency_service', (e.target as HTMLInputElement).checked)} />
              </label>
            </div>

            {/* Online Presence */}
            <div class="section">
              <h3 class="section-title">{t('worker.form.online')}</h3>

              <label class="field">
                <span>{t('worker.form.website')}</span>
                <input type="url" value={profile.website} onChange={e => updateField('website', (e.target as HTMLInputElement).value)} placeholder="https://mysite.com" />
              </label>

              <div class="field">
                <span>{t('worker.form.social')}</span>
                <div class="tag-input-row">
                  <input class="inp-social-plat" type="text" value={socialPlat} onChange={e => setSocialPlat((e.target as HTMLInputElement).value)} placeholder="Instagram" />
                  <input class="inp-social-url" type="text" value={socialUrl} onChange={e => setSocialUrl((e.target as HTMLInputElement).value)} placeholder="https://instagram.com/..." />
                  <button class="btn-sm" onClick={addSocial}>+</button>
                </div>
                <div class="tags">
                  {profile.social_links.map((s, i) => (
                    <span class="tag">{s.platform}: {s.url} <button class="tag-remove" onClick={() => removeSocial(i)}>×</button></span>
                  ))}
                </div>
              </div>
            </div>

            {/* Save */}
            <div class="save-area">
              <button class="btn-save" onClick={handleSave} disabled={saving}>
                {saving ? t('worker.form.saving') : t('worker.form.save')}
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

        /* --- Chat Column --- */
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

        /* --- Form Column --- */
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

        .field-row { flex-direction: row; align-items: center; justify-content: space-between; }
        .field-row input[type=checkbox] { width: 1.1rem; height: 1.1rem; accent-color: #4a6cf7; }

        .tag-input-row { display: flex; gap: 0.35rem; }
        .tag-input-row input { flex: 1; }
        .inp-social-plat { flex: 0 0 120px; }
        .inp-social-url { flex: 1; }

        .btn-sm { padding: 0.35rem 0.6rem; background: #4a6cf7; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.85rem; white-space: nowrap; }
        .btn-sm:hover { background: #5a7cf8; }

        .tags { display: flex; flex-wrap: wrap; gap: 0.35rem; margin-top: 0.35rem; }
        .tag { display: inline-flex; align-items: center; gap: 0.25rem; background: #2a2a4e; color: #c0c0ff; padding: 0.2rem 0.5rem; border-radius: 4px; font-size: 0.8rem; }
        .tag-remove { background: none; border: none; color: #f66; cursor: pointer; font-size: 1rem; padding: 0; line-height: 1; }

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
