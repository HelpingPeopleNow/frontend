import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { route } from 'preact-router';
import { useLanguage } from './i18n';
import AppShell from './AppShell';

const API = '/api';

interface Props {
  entity: string;       // URL slug: "users", "worker-profiles", etc.
  title: string;        // Display title
  columns: string[];    // Columns to show in the list
  idKey?: string;       // ID column name (default: "id")
  backTo?: string;      // Back link (default: "/admin")
  labelFn?: (row: Record<string, any>) => string; // Custom label for each row
}

export default function EntityListPage({ entity, title, columns, idKey = 'id', backTo = '/admin', labelFn }: Props) {
  const { t } = useLanguage();
  const [rows, setRows] = useState<Record<string, any>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`${API}/v1/admin/${entity}?limit=200`)
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then(data => { setRows(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(err => { setError(err.message); setLoading(false); });
  }, [entity]);

  const handleClick = (id: any) => {
    route(`${backTo}/${entity}/${id}`);
  };

  const handleDelete = async (id: any, e: Event) => {
    e.stopPropagation();
    if (!confirm(t('admin.confirm_delete') || 'Delete this record?')) return;
    try {
      const res = await fetch(`${API}/v1/admin/${entity}/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setRows(prev => prev.filter(r => String(r[idKey]) !== String(id)));
    } catch (err: any) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  const formatVal = (v: any) => {
    if (v === null || v === undefined) return '—';
    if (typeof v === 'boolean') return v ? '✓' : '✗';
    if (typeof v === 'string' && v.length > 60) return v.substring(0, 57) + '…';
    return String(v);
  };

  if (loading) return <AppShell currentPath="/admin" title="Admin"><div class="loading"><div class="spinner" /></div></AppShell>;
  if (error) return <AppShell currentPath="/admin" title="Admin"><div class="error-state">{t('admin.error')}: {error}</div></AppShell>;

  return (
    <AppShell currentPath="/admin" title="Admin">
      <div class="admin-page">
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)', marginBottom: 'var(--sp-5)' }}>
          <button class="btn btn-ghost" onClick={() => route(backTo)} style={{ fontSize: 'var(--text-lg)' }}>←</button>
          <h2 class="section-title" style={{ margin: 0 }}>{title} ({rows.length})</h2>
        </div>
        {rows.length === 0 ? (
          <div class="empty-state">{t('admin.no_records') || 'No records found.'}</div>
        ) : (
          <div class="entity-table-wrap">
            <table class="entity-table">
              <thead>
                <tr>
                  {columns.map(col => <th key={col}>{col}</th>)}
                  <th style={{ width: '60px' }}></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, idx) => (
                  <tr key={String(row[idKey]) || idx} onClick={() => handleClick(row[idKey])} style={{ cursor: 'pointer' }}>
                    {columns.map(col => (
                      <td key={col}>{formatVal(row[col])}</td>
                    ))}
                    <td>
                      <button
                        class="btn btn-ghost btn-sm"
                        onClick={(e: Event) => handleDelete(row[idKey], e)}
                        title={t('admin.delete') || 'Delete'}
                        style={{ color: 'var(--error)', padding: '2px 6px' }}
                      >×</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppShell>
  );
}
