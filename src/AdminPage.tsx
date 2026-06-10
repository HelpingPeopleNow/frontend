import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { route } from 'preact-router';
import { useLanguage, LangToggle } from './i18n';

const API = '/api';

interface SystemPrompts {
  helper_prompt: string;
  worker_profile_prompt: string;
  llm_provider: string;
  [key: string]: string;
}

interface PromptMeta {
  key: string;
  labelKey: string;
  descKey: string;
}

const PROVIDERS = [
  { value: '', labelKey: 'admin.provider.default' },
  { value: 'opencode', labelKey: 'OpenCode (external)' },
  { value: 'ollama', labelKey: 'Ollama (local)' },
  { value: 'mistral', labelKey: 'Mistral (cloud)' },
];

export default function AdminPage() {
  const { t, lang } = useLanguage();
  const [prompts, setPrompts] = useState<SystemPrompts | null>(null);
  const [editing, setEditing] = useState<Record<string, string>>({});
  const [provider, setProvider] = useState('');
  const [saving, setSaving] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    console.log('[Admin] Loading system prompts...');
    fetch(`${API}/v1/system-prompts`)
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data: SystemPrompts) => {
        console.log('[Admin] Prompts loaded:', data);
        setPrompts(data);
        setEditing({ 
          helper_prompt: data.helper_prompt || '',
          worker_profile_prompt: data.worker_profile_prompt || '',
        });
        setProvider(data.llm_provider ?? '');
      })
      .catch((err: Error) => {
        console.error('[Admin] Failed to load prompts:', err.message);
        setMessage(t('admin.load.error'));
      });
  }, []);

  const handleSave = async (col: string) => {
    console.log(`[Admin] Saving ${col}...`);
    setSaving(col);
    try {
      const start = performance.now();
      const res = await fetch(`${API}/v1/system-prompts/${col.replace('_prompt', '')}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editing[col] }),
      });
      const elapsed = (performance.now() - start).toFixed(0);
      const data = await res.json();
      if (res.ok) {
        console.log(`[Admin] ${col} saved OK (${elapsed}ms)`);
        setMessage(`✅ ${labelFor(col)} updated`);
        if (data.llm_provider !== undefined) setProvider(data.llm_provider);
      } else {
        console.error(`[Admin] ${col} save failed (${elapsed}ms): ${data.error || 'unknown'}`);
        setMessage(`❌ ${data.error || 'update failed'}`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'request failed';
      console.error(`[Admin] Save error: ${msg}`, err);
      setMessage(`❌ ${msg}`);
    } finally {
      setSaving(null);
    }
  };

  const handleProviderSave = async () => {
    setSaving('provider');
    try {
      const res = await fetch(`${API}/v1/system-prompts/provider`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: provider }),
      });
      const data = await res.json();
      if (res.ok) {
        const label = PROVIDERS.find(p => p.value === provider);
        setMessage(`✅ LLM Provider changed to ${label?.labelKey || provider || 'default'}`);
        if (data.llm_provider !== undefined) setProvider(data.llm_provider);
      } else {
        setMessage(`❌ ${data.error || 'update failed'}`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'request failed';
      setMessage(`❌ ${msg}`);
    } finally {
      setSaving(null);
    }
  };

  const labelFor = (col: string) => {
    const meta = promptMeta.find(m => m.key === col);
    return meta ? t(meta.labelKey) : col;
  };

  const promptMeta: PromptMeta[] = [
    { key: 'helper_prompt', labelKey: 'admin.prompt.helper', descKey: 'admin.helper.desc' },
    { key: 'worker_profile_prompt', labelKey: 'admin.prompt.worker', descKey: 'admin.worker.desc' },
  ];

  return (
    <div style={{
      minHeight: '100vh', fontFamily: 'system-ui, sans-serif', background: '#1a1a2e', color: '#e0e0e0', padding: '2rem',
    } as h.JSX.CSSProperties}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '1rem' }}>
          <button onClick={() => route('/', true)} style={{
            background: 'none', border: '1px solid #0f3460', color: '#00d4ff', cursor: 'pointer',
            padding: '0.35rem 0.75rem', borderRadius: '6px', fontSize: '0.85rem',
          }}>{t('nav.back')}</button>
          <div>
            <h2 style={{ fontSize: '1.8rem', color: '#fff', margin: 0 }}>{t('admin.title')}</h2>
            <p style={{ margin: '0.25rem 0 0', color: '#888' }}>{t('admin.subtitle')}</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <LangToggle />
          <a href="/adminer" target="_blank" rel="noopener noreferrer" style={{
            padding: '0.5rem 1.25rem', background: '#0f3460', color: '#00d4ff',
            textDecoration: 'none', borderRadius: '6px', fontSize: '0.85rem',
            border: '1px solid #00d4ff',
          }}>{t('admin.db')}</a>
        </div>
      </div>

      {message && (
        <div style={{ marginBottom: '1rem', padding: '0.5rem 1rem', background: '#16213e', borderRadius: '6px' }}>
          {message}
        </div>
      )}

      {prompts === null ? <p>{t('admin.loading')}</p> : (
        <div style={{ maxWidth: '800px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          {/* --- LLM Provider Selector --- */}
          <div style={{ background: '#16213e', borderRadius: '10px', padding: '1.5rem', border: '1px solid #0f3460' }}>
            <div style={{ marginBottom: '0.75rem' }}>
              <strong style={{ color: '#00d4ff' }}>{t('admin.provider')}</strong>
              <span style={{ marginLeft: '0.75rem', fontSize: '0.8rem', color: '#666' }}>
                {t('admin.provider.desc')}
              </span>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <select
                value={provider}
                onChange={(e) => setProvider(e.currentTarget.value)}
                style={{
                  flex: 1, padding: '0.6rem 0.75rem', fontFamily: 'monospace',
                  background: '#1a1a2e', color: '#e0e0e0', border: '1px solid #0f3460',
                  borderRadius: '6px', fontSize: '1rem',
                }}
              >
                {PROVIDERS.map(p => (
                  <option key={p.value} value={p.value}>{p.labelKey.startsWith('admin.') ? t(p.labelKey) : p.labelKey}</option>
                ))}
              </select>
              <button onClick={handleProviderSave} disabled={saving === 'provider'}
                style={{
                  padding: '0.6rem 1.5rem', border: 'none', borderRadius: '6px',
                  background: saving === 'provider' ? '#555' : '#00d4ff',
                  color: '#1a1a2e', cursor: 'pointer', fontWeight: 600,
                  whiteSpace: 'nowrap',
                }}>
                {saving === 'provider' ? t('admin.saving') : t('admin.save')}
              </button>
            </div>
          </div>

          {/* --- Textarea prompt editors --- */}
          {promptMeta.map(({ key, labelKey, descKey }) => (
            <div key={key} style={{ background: '#16213e', borderRadius: '10px', padding: '1.5rem', border: '1px solid #0f3460' }}>
              <div style={{ marginBottom: '0.5rem' }}>
                <strong style={{ color: '#00d4ff' }}>{t(labelKey)}</strong>
                <span style={{ marginLeft: '0.75rem', fontSize: '0.8rem', color: '#666' }}>{t(descKey)}</span>
              </div>
              <textarea
                value={editing[key] || ''}
                onChange={(e) => setEditing({ ...editing, [key]: e.currentTarget.value })}
                rows={5}
                style={{ width: '100%', padding: '0.75rem', fontFamily: 'monospace', background: '#1a1a2e', color: '#e0e0e0', border: '1px solid #0f3460', borderRadius: '6px' }}
              />
              <div style={{ textAlign: 'right', marginTop: '0.5rem' }}>
                <button onClick={() => handleSave(key)} disabled={saving === key}
                  style={{ padding: '0.5rem 1.5rem', border: 'none', borderRadius: '6px', background: saving === key ? '#555' : '#00d4ff', color: '#1a1a2e', cursor: 'pointer' }}>
                  {saving === key ? t('admin.saving') : `${t('admin.save')} ${t(labelKey)}`}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
