import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { route } from 'preact-router';
import { useLanguage } from './i18n';
import AppShell from './AppShell';

const API = '/api';
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
  document.title = `Admin - ${title.replace(/^[^\s]+\s/, '')} #${id} | HelpingPeopleNow`;
  const [data, setData] = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const listPath = backTo || `/admin/${entity}`;

  useEffect(() => {
    fetch(`${API}/v1/admin/${entity}/${id}`)
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then(d => { setData(d); setForm(d); setLoading(false); })
      .catch(err => { setError(err.message); setLoading(false); });
  }, [entity, id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API}/v1/admin/${entity}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `HTTP ${res.status}`);
      }
      setData(form);
      setEditing(false);
    } catch (err: any) {
      alert(`Save failed: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(t('admin.confirm_delete') || 'Delete this record?')) return;
    try {
      const res = await fetch(`${API}/v1/admin/${entity}/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      route(listPath);
    } catch (err: any) {
      alert(`Delete failed: ${err.message}`);
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
                    onChange={(e: any) => handleChange(key, e.target.value)}
                  >
                    <option value="true">true</option>
                    <option value="false">false</option>
                  </select>
                ) : (
                  <input
                    class="input"
                    type={typeof data[key] === 'number' ? 'number' : 'text'}
                    value={form[key] === null ? '' : String(form[key] ?? '')}
                    onInput={(e: any) => handleChange(key, e.target.value)}
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
