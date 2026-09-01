import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { logError } from './lib/logger';
import { useLanguage } from './i18n';
import AppShell from './AppShell';
import { getSystemPrompts, updateLlmProviders } from './services/systemPrompts';
import { ApiError } from './services/api';

const PROVIDERS: { value: string; label: string; desc: string }[] = [
  { value: 'groq', label: 'Groq', desc: 'cloud · zero-cost primary · GROQ_API_KEY required' },
  { value: 'openrouter', label: 'OpenRouter', desc: 'cloud · zero-cost primary · OPENROUTER_API_KEY required' },
  { value: 'opencode0', label: 'OpenCode 0', desc: 'Big Pickle' },
  { value: 'opencode1', label: 'OpenCode 1', desc: 'DeepSeek V4 Flash' },
  { value: 'opencode2', label: 'OpenCode 2', desc: 'Mimo V2.5' },
  { value: 'mistral', label: 'Mistral', desc: 'cloud · MISTRAL_API_KEY required' },
  { value: 'ollama', label: 'Ollama', desc: 'local fallback' },
];

export default function AdminLLMPage() {
  const { t } = useLanguage();
  document.title = `Admin - LLM Provider | Helping People`;
  const [selected, setSelected] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    getSystemPrompts()
      .then((data) => {
        const loaded = data.llm_providers ?? [];
        const withOllama = loaded.includes('ollama') ? loaded : [...loaded, 'ollama'];
        setSelected(withOllama);
      })
      .catch((e) => {
        logError('admin', `load provider failed: ${e instanceof Error ? e.message : String(e)}`);
        setMessage(t('admin.load.error'));
      });
  }, []);

  const toggle = (value: string) => {
    if (value === 'ollama') return;
    setSelected(prev =>
      prev.includes(value) ? prev.filter(p => p !== value) : [...prev, value]
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const ordered = PROVIDERS.filter((p) => selected.includes(p.value)).map((p) => p.value);
      const data = await updateLlmProviders(ordered);
      setSelected(data.llm_providers ?? []);
      setMessage(`✓ LLM providers updated: ${ordered.length === 0 ? 'auto (helper default)' : ordered.join(', ')}`);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : err instanceof Error ? err.message : 'request failed';
      logError('admin', `save provider failed: ${msg}`);
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
            <span class="admin-card-desc">
              {t('admin.provider.desc')}
              {' '}Empty selection = helper auto-fallback chain (OpenCode 0 → 1 → 2 → Mistral → Ollama).
            </span>
          </div>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 'var(--sp-4)' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              <th style={{ width: 40, padding: 'var(--sp-2)' }}></th>
              <th style={{ textAlign: 'left', padding: 'var(--sp-2)', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>Provider</th>
              <th style={{ textAlign: 'left', padding: 'var(--sp-2)', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>Model / Notes</th>
            </tr>
          </thead>
          <tbody>
            {PROVIDERS.map((p) => (
              <tr key={p.value} style={{ borderBottom: '1px solid var(--border-subtle)', cursor: p.value === 'ollama' ? 'default' : 'pointer' }} onClick={p.value === 'ollama' ? undefined : () => toggle(p.value)}>
                <td style={{ padding: 'var(--sp-2)', textAlign: 'center' }}>
                  {p.value === 'ollama' ? (
                    <span style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-xs)' }}>🔒 always on</span>
                  ) : (
                    <input type="checkbox" checked={selected.includes(p.value)} onChange={() => toggle(p.value)} onClick={(e) => e.stopPropagation()} />
                  )}
                </td>
                <td style={{ padding: 'var(--sp-2)', fontWeight: 500 }}>{p.label}</td>
                <td style={{ padding: 'var(--sp-2)', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>{p.desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button class="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? t('admin.saving') : t('admin.save')}
          </button>
        </div>
      </div>
    </AppShell>
  );
}
