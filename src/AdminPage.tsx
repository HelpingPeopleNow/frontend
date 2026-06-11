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
          client_profile_prompt: data.client_profile_prompt || '',
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
    { key: 'client_profile_prompt', labelKey: 'admin.prompt.client', descKey: 'admin.client.desc' },
  ];

  return (
    <div class="admin-page">
      <div class="admin-header">
        <div class="admin-header-left">
          <button class="btn btn-ghost" onClick={() => route('/', true)}>{t('nav.back')}</button>
          <div>
            <h2>{t('admin.title')}</h2>
            <p>{t('admin.subtitle')}</p>
          </div>
        </div>
        <div class="admin-header-right">
          <LangToggle />
          <a href="/adminer" target="_blank" rel="noopener noreferrer" class="btn btn-ghost">{t('admin.db')}</a>
        </div>
      </div>

      {message && (
        <div class="card" style={{ marginBottom: '1rem' }}>
          <p style={{ fontSize: '0.875rem' }}>{message}</p>
        </div>
      )}

      {prompts === null ? <p class="loading">{t('admin.loading')}</p> : (
        <div class="admin-panels">
          {/* LLM Provider Selector */}
          <div class="admin-panel">
            <div class="admin-panel-label">
              <strong>{t('admin.provider')}</strong>
              <span>{t('admin.provider.desc')}</span>
            </div>
            <div class="admin-panel-row">
              <select
                class="select"
                value={provider}
                onChange={(e) => setProvider(e.currentTarget.value)}
              >
                {PROVIDERS.map(p => (
                  <option key={p.value} value={p.value}>{p.labelKey.startsWith('admin.') ? t(p.labelKey) : p.labelKey}</option>
                ))}
              </select>
              <button class="btn btn-primary" onClick={handleProviderSave} disabled={saving === 'provider'}>
                {saving === 'provider' ? t('admin.saving') : t('admin.save')}
              </button>
            </div>
          </div>

          {/* Textarea prompt editors */}
          {promptMeta.map(({ key, labelKey, descKey }) => (
            <div key={key} class="admin-panel">
              <div class="admin-panel-label">
                <strong>{t(labelKey)}</strong>
                <span>{t(descKey)}</span>
              </div>
              <textarea
                class="admin-textarea"
                value={editing[key] || ''}
                onChange={(e) => setEditing({ ...editing, [key]: e.currentTarget.value })}
                rows={5}
              />
              <div class="admin-panel-footer">
                <button class="btn btn-primary" onClick={() => handleSave(key)} disabled={saving === key}>
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
