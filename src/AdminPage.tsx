import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { useLanguage } from './i18n';
import AppShell from './AppShell';

const API = '/api';

interface SystemPrompts {
  worker_profile_prompt: string;
  client_profile_prompt: string;
  find_trader_search_prompt: string;
  find_trader_presentation_prompt: string;
  llm_provider: string;
  [key: string]: string;
}

const PROVIDERS: { value: string; labelKey?: string; label?: string }[] = [
  { value: '', labelKey: 'admin.provider.default' },
  { value: 'opencode', label: 'OpenCode (external)' },
  { value: 'ollama', label: 'Ollama (local)' },
  { value: 'mistral', label: 'Mistral (cloud)' },
];

export default function AdminPage() {
  const { t } = useLanguage();
  const [prompts, setPrompts] = useState<SystemPrompts | null>(null);
  const [editing, setEditing] = useState<Record<string, string>>({});
  const [provider, setProvider] = useState('');
  const [saving, setSaving] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch(`${API}/v1/system-prompts`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then((data: SystemPrompts) => {
        setPrompts(data);
        setEditing({
          worker_profile_prompt: data.worker_profile_prompt || '',
          client_profile_prompt: data.client_profile_prompt || '',
          find_trader_search_prompt: data.find_trader_search_prompt || '',
          find_trader_presentation_prompt: data.find_trader_presentation_prompt || '',
        });
        setProvider(data.llm_provider ?? '');
      })
      .catch(() => setMessage(t('admin.load.error')));
  }, []);

  const handleSave = async (col: string) => {
    setSaving(col);
    try {
      const res = await fetch(`${API}/v1/system-prompts/${col.replace('_prompt', '')}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editing[col] }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage(`✓ ${labelFor(col)} updated`);
        if (data.llm_provider !== undefined) setProvider(data.llm_provider);
      } else {
        setMessage(`✕ ${data.error || 'update failed'}`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'request failed';
      setMessage(`✕ ${msg}`);
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
        setMessage(`✓ LLM Provider changed to ${label?.label ?? provider ?? 'default'}`);
        if (data.llm_provider !== undefined) setProvider(data.llm_provider);
      } else {
        setMessage(`✕ ${data.error || 'update failed'}`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'request failed';
      setMessage(`✕ ${msg}`);
    } finally {
      setSaving(null);
    }
  };

  const labelFor = (col: string) => {
    const map: Record<string, string> = {
      worker_profile_prompt: 'admin.prompt.worker',
      client_profile_prompt: 'admin.prompt.client',
      find_trader_search_prompt: 'admin.prompt.find_trader_search',
      find_trader_presentation_prompt: 'admin.prompt.find_trader_presentation',
    };
    return map[col] ? t(map[col]) : col;
  };

  const promptMeta = [
    { key: 'worker_profile_prompt', labelKey: 'admin.prompt.worker', descKey: 'admin.worker.desc' },
    { key: 'client_profile_prompt', labelKey: 'admin.prompt.client', descKey: 'admin.client.desc' },
    { key: 'find_trader_search_prompt', labelKey: 'admin.prompt.find_trader_search', descKey: 'admin.find_trader_search.desc' },
    { key: 'find_trader_presentation_prompt', labelKey: 'admin.prompt.find_trader_presentation', descKey: 'admin.find_trader_presentation.desc' },
  ];

  return (
    <AppShell currentPath="/admin" title={t('admin.title')}>
      <div style={{ textAlign: 'right', marginBottom: 'var(--sp-3)' }}>
        <a href="/adminer" target="_blank" rel="noopener noreferrer" class="btn btn-ghost btn-sm">
          {t('admin.db')}
        </a>
      </div>

      {message && (
        <div style={{
          padding: 'var(--sp-3) var(--sp-4)',
          background: message.startsWith('✓') ? 'var(--success-subtle)' : 'var(--error-subtle)',
          border: `1px solid ${message.startsWith('✓') ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`,
          borderRadius: 'var(--r-md)',
          fontSize: 'var(--text-sm)',
          marginBottom: 'var(--sp-5)',
          color: message.startsWith('✓') ? 'var(--success)' : 'var(--error)',
        }}>
          {message}
        </div>
      )}

      {prompts === null ? (
        <div class="loading"><div class="spinner" /> {t('admin.loading')}</div>
      ) : (
        <div class="admin-grid">
          {/* LLM Provider */}
          <div class="admin-card">
            <div class="admin-card-header">
              <div>
                <span class="admin-card-label">{t('admin.provider')}</span>
                <span class="admin-card-desc">{t('admin.provider.desc')}</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 'var(--sp-3)', alignItems: 'center' }}>
              <select class="select" value={provider} onChange={(e) => setProvider(e.currentTarget.value)} style={{ flex: 1 }}>
                {PROVIDERS.map(p => (
                  <option key={p.value} value={p.value}>{p.labelKey ? t(p.labelKey) : (p.label || p.value)}</option>
                ))}
              </select>
              <button class="btn btn-primary" onClick={handleProviderSave} disabled={saving === 'provider'}>
                {saving === 'provider' ? t('admin.saving') : t('admin.save')}
              </button>
            </div>
          </div>

          {/* Prompt editors */}
          {promptMeta.map(({ key, labelKey, descKey }) => (
            <div key={key} class="admin-card">
              <div class="admin-card-header">
                <div>
                  <span class="admin-card-label">{t(labelKey)}</span>
                  <span class="admin-card-desc">{t(descKey)}</span>
                </div>
              </div>
              <textarea
                class="textarea admin-textarea"
                value={editing[key] || ''}
                onChange={(e) => setEditing({ ...editing, [key]: e.currentTarget.value })}
                rows={6}
              />
              <div style={{ textAlign: 'right', marginTop: 'var(--sp-3)' }}>
                <button class="btn btn-primary btn-sm" onClick={() => handleSave(key)} disabled={saving === key}>
                  {saving === key ? t('admin.saving') : `${t('admin.save')} ${t(labelKey)}`}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </AppShell>
  );
}
