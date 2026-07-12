import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { route } from 'preact-router';
import { logError } from './lib/logger';
import { useLanguage } from './i18n';
import AppShell from './AppShell';
import { getEntity, updateEntity, deleteEntity } from './services/admin';
import { ApiError } from './services/api';
const READONLY_KEYS = ['id', 'created_at', 'createdAt', 'updated_at', 'updatedAt', 'user_id', 'conversation_id'];

interface Props {
  entity: string;
  title: string;
  id: string;
  backTo?: string;
  editable?: boolean;
}

export default function EntityDetailPage({ entity, title, id, backTo, editable = true }: Props) {
  const { t } = useLanguage();
  document.title = `Admin - ${title.replace(/^[^\s]+\s/, '')} #${id} | Helping People`;
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Record<string, unknown>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const listPath = backTo || `/admin/${entity}`;

  useEffect(() => {
    getEntity<Record<string, unknown>>(entity, id)
      .then(d => { setData(d); setForm(d); setLoading(false); })
      .catch(err => {
        const msg = err instanceof ApiError ? err.message : err instanceof Error ? err.message : 'request failed';
        logError('admin', `get ${entity}/${id} failed: ${msg}`);
        setError(msg); setLoading(false);
      });
  }, [entity, id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateEntity(entity, id, form);
      setData(form);
      setEditing(false);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : err instanceof Error ? err.message : 'request failed';
      logError('admin', `save ${entity}/${id} failed: ${msg}`);
      alert(`Save failed: ${msg}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(t('admin.confirm_delete') || 'Delete this record?')) return;
    try {
      await deleteEntity(entity, id);
      route(listPath);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : err instanceof Error ? err.message : 'request failed';
      logError('admin', `delete ${entity}/${id} failed: ${msg}`);
      alert(`Delete failed: ${msg}`);
    }
  };

  const handleChange = (key: string, val: string) => {
    // Try to preserve numeric/boolean types
    if (val === 'true') setForm(prev => ({ ...prev, [key]: true }));
    else if (val === 'false') setForm(prev => ({ ...prev, [key]: false }));
    else if (val === '' || val === 'null') setForm(prev => ({ ...prev, [key]: null }));
    else if (/^\d+(\.\d+)?$/.test(val) && data && typeof data[key] === 'number') {
      setForm(prev => ({ ...prev, [key]: Number(val) }));
    } else {
      setForm(prev => ({ ...prev, [key]: val }));
    }
  };

  if (loading) return <AppShell currentPath="/admin" title="Admin"><div class="loading"><div class="spinner" /></div></AppShell>;
  if (error) return <AppShell currentPath="/admin" title="Admin"><div class="error-state">{t('admin.error')}: {error}</div></AppShell>;
  if (!data) return <AppShell currentPath="/admin" title="Admin"><div class="empty-state">Not found</div></AppShell>;

  const keys = Object.keys(data);

  return (
    <AppShell currentPath="/admin" title="Admin">
      <div class="admin-page">
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)', marginBottom: 'var(--sp-5)' }}>
          <button class="btn btn-ghost" onClick={() => route(listPath)} style={{ fontSize: 'var(--text-lg)' }}>←</button>
          <h2 class="section-title" style={{ margin: 0 }}>{title} #{id}</h2>
          <div style={{ flex: 1 }} />
          {editable && !editing && (
            <button class="btn btn-primary" onClick={() => setEditing(true)}>
              {t('admin.edit') || 'Edit'}
            </button>
          )}
          {editing && (
            <>
              <button class="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? '…' : (t('admin.save') || 'Save')}
              </button>
              <button class="btn btn-ghost" onClick={() => { setEditing(false); setForm(data); }}>
                {t('admin.cancel') || 'Cancel'}
              </button>
            </>
          )}
          <button class="btn btn-ghost" onClick={handleDelete} style={{ color: 'var(--error)' }}>
            {t('admin.delete') || 'Delete'}
          </button>
        </div>

        <div class="admin-card">
          {keys.map(key => (
            editing && READONLY_KEYS.includes(key) ? null : (
            <div class="entity-field" key={key}>
              <label class="entity-field-label">{key}</label>
              {editing && !READONLY_KEYS.includes(key) ? (
                typeof data[key] === 'boolean' ? (
                  <select
                    class="input"
                    value={form[key] ? 'true' : 'false'}
                    onChange={(e: Event) => handleChange(key, (e.target as HTMLSelectElement).value)}
                  >
                    <option value="true">true</option>
                    <option value="false">false</option>
                  </select>
                ) : (
                  <input
                    class="input"
                    type={typeof data[key] === 'number' ? 'number' : 'text'}
                    value={form[key] === null ? '' : String(form[key] ?? '')}
                    onInput={(e: Event) => handleChange(key, (e.target as HTMLInputElement).value)}
                  />
                )
              ) : (
                <div class="entity-field-value">
                  {data[key] === null ? (
                    <span class="text-muted">null</span>
                  ) : key.toLowerCase().includes('id') && String(data[key]).length > 8 ? (
                    <span title={String(data[key])} style={{ cursor: 'help' }}>
                      {String(data[key]).substring(0, 4)}…{String(data[key]).substring(String(data[key]).length - 4)}
                    </span>
                  ) : (
                    String(data[key])
                  )}
                </div>
              )}
            </div>
            )
          ))}
        </div>
      </div>
    </AppShell>
  );
}
