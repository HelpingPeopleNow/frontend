import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { useLanguage } from './i18n';
import AppShell from './AppShell';
import { getSystemPrompts, updateSystemPromptColumn, SystemPromptDTO } from './services/systemPrompts';
import { ApiError } from './services/api';

const promptMeta = [
  { key: 'worker_profile_prompt', labelKey: 'admin.prompt.worker', descKey: 'admin.worker.desc' },
  { key: 'client_profile_prompt', labelKey: 'admin.prompt.client', descKey: 'admin.client.desc' },
  { key: 'find_trader_search_prompt', labelKey: 'admin.prompt.find_trader_search', descKey: 'admin.find_trader_search.desc' },
  { key: 'find_trader_presentation_prompt', labelKey: 'admin.prompt.find_trader_presentation', descKey: 'admin.find_trader_presentation.desc' },
];

export default function AdminPromptsPage() {
  const { t } = useLanguage();
  document.title = `Admin - System Prompts | Helping People`;
  const [prompts, setPrompts] = useState<SystemPromptDTO | null>(null);
  const [editing, setEditing] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    getSystemPrompts()
      .then((data) => {
        setPrompts(data);
        setEditing({
          worker_profile_prompt: data.worker_profile_prompt || '',
          client_profile_prompt: data.client_profile_prompt || '',
          find_trader_search_prompt: data.find_trader_search_prompt || '',
          find_trader_presentation_prompt: data.find_trader_presentation_prompt || '',
        });
      })
      .catch(() => setMessage(t('admin.load.error')));
  }, []);

  const handleSave = async (col: string) => {
    setSaving(col);
    try {
      await updateSystemPromptColumn(col.replace('_prompt', ''), editing[col] || '');
      setMessage(`✓ ${t(labelFor(col))} updated`);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : err instanceof Error ? err.message : 'request failed';
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

  return (
    <AppShell currentPath="/admin" title={t('admin.menu.prompts')}>
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

      {prompts === null ? (
        <div class="loading"><div class="spinner" /> {t('admin.loading')}</div>
      ) : (
        <div class="admin-grid">
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
