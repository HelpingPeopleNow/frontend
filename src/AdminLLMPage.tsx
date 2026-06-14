import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { useLanguage } from './i18n';
import AppShell from './AppShell';

const API = '/api';

const PROVIDERS: { value: string; labelKey?: string; label?: string }[] = [
  { value: '', labelKey: 'admin.provider.default' },
  { value: 'opencode', label: 'OpenCode (external)' },
  { value: 'ollama', label: 'Ollama (local)' },
  { value: 'mistral', label: 'Mistral (cloud)' },
];

export default function AdminLLMPage() {
  const { t } = useLanguage();
  const [provider, setProvider] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch(`${API}/v1/system-prompts`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then((data) => setProvider(data.llm_provider ?? ''))
      .catch(() => setMessage(t('admin.load.error')));
  }, []);

  const handleProviderSave = async () => {
    setSaving(true);
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
      setSaving(false);
    }
  };

  return (
    <AppShell currentPath="/admin" title={t('admin.menu.llm')}>
      <div style={{ marginBottom: 'var(--sp-4)' }}>
        <a href="/admin" class="btn btn-ghost btn-sm">← {t('admin.back')}</a>
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
          <button class="btn btn-primary" onClick={handleProviderSave} disabled={saving}>
            {saving ? t('admin.saving') : t('admin.save')}
          </button>
        </div>
      </div>
    </AppShell>
  );
}
