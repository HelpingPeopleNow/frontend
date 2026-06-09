import { h } from 'preact';
import { route } from 'preact-router';
import { useState, useEffect } from 'preact/hooks';
import { useAuth } from './AuthProvider';

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

export default function WorkerPage() {
  const { session, logout } = useAuth();
  const [profile, setProfile] = useState<WorkerProfile>({
    user_id: '',
    profession: '',
    business_name: '',
    bio: '',
    phone: '',
    city: '',
    service_radius_km: 25,
    address: '',
    hourly_rate: 0,
    minimum_charge: 0,
    free_estimate: true,
    years_experience: 0,
    certifications: [],
    has_insurance: false,
    languages: [],
    emergency_service: false,
    website: '',
    social_links: [],
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

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
              ...p,
              ...data,
              certifications: data.certifications || [],
              languages: data.languages || [],
              social_links: data.social_links || [],
            }));
          }
        }
      } catch (e) {
        // Profile might not exist yet — that's fine
      } finally {
        setLoading(false);
      }
    })();
  }, []);

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

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    setError('');
    try {
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
      setProfile(p => ({
        ...p,
        ...updated,
        certifications: updated.certifications || [],
        languages: updated.languages || [],
        social_links: updated.social_links || [],
      }));
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e: any) {
      setError(e.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    route('/login', true);
  };

  if (loading) {
    return (
      <div class="role-page">
        <div class="role-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p style={{ color: '#888' }}>Loading profile…</p>
        </div>
      </div>
    );
  }

  return (
    <div class="role-page">
      <div class="role-header">
        <h2>Worker Profile</h2>
        <div class="header-right">
          <span class="user-email">{session?.user?.email}</span>
          <button class="btn-chat" onClick={() => route('/', true)}>Chat</button>
          <button class="btn-logout" onClick={handleLogout}>Logout</button>
        </div>
      </div>

      <div class="role-content">
        {error && <div class="msg msg-error">{error}</div>}
        {saved && <div class="msg msg-success">Profile saved successfully!</div>}

        {/* --- Core Identity --- */}
        <div class="section">
          <h3 class="section-title">Core Identity</h3>

          <label class="field">
            <span>Profession</span>
            <select value={profile.profession} onChange={e => updateField('profession', (e.target as HTMLSelectElement).value)}>
              <option value="">Select your profession</option>
              {PROFESSIONS.map(p => <option value={p}>{p}</option>)}
            </select>
          </label>

          <label class="field">
            <span>Business Name</span>
            <input type="text" value={profile.business_name} onChange={e => updateField('business_name', (e.target as HTMLInputElement).value)} placeholder="Alvaro's Repairs SL" />
          </label>

          <label class="field">
            <span>Bio</span>
            <textarea rows={3} value={profile.bio} onChange={e => updateField('bio', (e.target as HTMLTextAreaElement).value)} placeholder="10 years fixing leaks in Madrid" />
          </label>

          <label class="field">
            <span>Phone</span>
            <input type="tel" value={profile.phone} onChange={e => updateField('phone', (e.target as HTMLInputElement).value)} placeholder="+34 612 345 678" />
          </label>
        </div>

        {/* --- Location & Service Area --- */}
        <div class="section">
          <h3 class="section-title">Location & Service Area</h3>

          <label class="field">
            <span>City</span>
            <input type="text" value={profile.city} onChange={e => updateField('city', (e.target as HTMLInputElement).value)} placeholder="Madrid" />
          </label>

          <label class="field">
            <span>Service Radius (km)</span>
            <input type="number" min={0} max={200} value={profile.service_radius_km} onChange={e => updateField('service_radius_km', parseInt((e.target as HTMLInputElement).value) || 0)} />
          </label>

          <label class="field">
            <span>Address</span>
            <input type="text" value={profile.address} onChange={e => updateField('address', (e.target as HTMLInputElement).value)} placeholder="Calle Mayor 10, 28013" />
          </label>
        </div>

        {/* --- Pricing --- */}
        <div class="section">
          <h3 class="section-title">Pricing</h3>

          <label class="field">
            <span>Hourly Rate (€)</span>
            <input type="number" min={0} step={0.5} value={profile.hourly_rate || ''} onChange={e => updateField('hourly_rate', parseFloat((e.target as HTMLInputElement).value) || 0)} placeholder="35.00" />
          </label>

          <label class="field">
            <span>Minimum Charge (€)</span>
            <input type="number" min={0} step={0.5} value={profile.minimum_charge || ''} onChange={e => updateField('minimum_charge', parseFloat((e.target as HTMLInputElement).value) || 0)} placeholder="50.00" />
          </label>

          <label class="field field-row">
            <span>Free Estimate</span>
            <input type="checkbox" checked={profile.free_estimate} onChange={e => updateField('free_estimate', (e.target as HTMLInputElement).checked)} />
          </label>
        </div>

        {/* --- Credentials --- */}
        <div class="section">
          <h3 class="section-title">Credentials</h3>

          <label class="field">
            <span>Years of Experience</span>
            <input type="number" min={0} max={70} value={profile.years_experience} onChange={e => updateField('years_experience', parseInt((e.target as HTMLInputElement).value) || 0)} />
          </label>

          <div class="field">
            <span>Certifications</span>
            <div class="tag-input-row">
              <input type="text" value={certInput} onChange={e => setCertInput((e.target as HTMLInputElement).value)} placeholder="Gas Cert" onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addCert())} />
              <button class="btn-sm" onClick={addCert}>+</button>
            </div>
            <div class="tags">
              {profile.certifications.map((c, i) => (
                <span class="tag">{c} <button class="tag-remove" onClick={() => removeCert(i)}>×</button></span>
              ))}
            </div>
          </div>

          <label class="field field-row">
            <span>Has Insurance</span>
            <input type="checkbox" checked={profile.has_insurance} onChange={e => updateField('has_insurance', (e.target as HTMLInputElement).checked)} />
          </label>

          <div class="field">
            <span>Languages</span>
            <div class="tag-input-row">
              <input type="text" value={langInput} onChange={e => setLangInput((e.target as HTMLInputElement).value)} placeholder="Spanish" onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addLang())} />
              <button class="btn-sm" onClick={addLang}>+</button>
            </div>
            <div class="tags">
              {profile.languages.map((l, i) => (
                <span class="tag">{l} <button class="tag-remove" onClick={() => removeLang(i)}>×</button></span>
              ))}
            </div>
          </div>

          <label class="field field-row">
            <span>Emergency Service</span>
            <input type="checkbox" checked={profile.emergency_service} onChange={e => updateField('emergency_service', (e.target as HTMLInputElement).checked)} />
          </label>
        </div>

        {/* --- Online Presence --- */}
        <div class="section">
          <h3 class="section-title">Online Presence</h3>

          <label class="field">
            <span>Website</span>
            <input type="url" value={profile.website} onChange={e => updateField('website', (e.target as HTMLInputElement).value)} placeholder="https://mysite.com" />
          </label>

          <div class="field">
            <span>Social Networks</span>
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
            {saving ? 'Saving…' : 'Save Profile'}
          </button>
        </div>
      </div>

      <style>{`
        .role-page { display: flex; flex-direction: column; height: 100vh; max-width: 820px; margin: 0 auto; }
        .role-header { display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 1rem; background: #1a1a2e; border-bottom: 1px solid #333; }
        .role-header h2 { margin: 0; font-size: 1.2rem; color: #4a6cf7; }
        .role-content { flex: 1; padding: 1.5rem 1rem; overflow-y: auto; }
        .header-right { display: flex; align-items: center; gap: 0.5rem; }
        .user-email { color: #888; font-size: 0.85rem; }
        .btn-chat, .btn-logout { padding: 0.35rem 0.75rem; border: none; border-radius: 4px; cursor: pointer; font-size: 0.85rem; }
        .btn-chat { background: #4a6cf7; color: white; }
        .btn-logout { background: #444; color: #ccc; }

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
