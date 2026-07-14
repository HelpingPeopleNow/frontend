import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { route } from 'preact-router';
import { logError } from './lib/logger';
import { useLanguage } from './i18n';
import AppShell from './AppShell';
import { listEntities, deleteEntity } from './services/admin';
import { ApiError } from './services/api';

interface Props {
  entity: string;       // URL slug: "users", "worker-profiles", etc.
  title: string;        // Display title
  columns: string[];    // Columns to show in the list
  idKey?: string;       // ID column name (default: "id")
  backTo?: string;      // Back link (default: "/admin")
  labelFn?: (row: Record<string, unknown>) => string; // Custom label for each row
  linkable?: boolean;   // Whether rows link to detail page (default: true)
  userColumns?: string[]; // Columns holding user IDs to resolve to emails
}

export default function EntityListPage({ entity, title, columns, idKey = 'id', backTo = '/admin', labelFn: _labelFn, linkable = true, userColumns }: Props) {
  const { t } = useLanguage();
  document.title = `Admin - ${title.replace(/^[^\s]+\s/, '')} | Helping People`;
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [userMap, setUserMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const tasks: [Promise<unknown>, (data: unknown) => void][] = [
      [listEntities<Record<string, unknown>>(entity, 200), (data) => {
        setRows(Array.isArray(data) ? data : []);
      }],
    ];
    if (userColumns && userColumns.length > 0) {
      tasks.push([listEntities<{ id: string; email: string }>('users', 1000), (data) => {
        const map: Record<string, string> = {};
        if (Array.isArray(data)) for (const u of data as { id: string; email: string }[]) map[u.id] = u.email;
        setUserMap(map);
      }]);
    }

    Promise.allSettled(tasks.map(t => t[0]))
      .then(results => {
        results.forEach((res, i) => {
          if (res.status === 'fulfilled') {
            tasks[i][1]((res as PromiseFulfilledResult<unknown>).value);
          } else if (i === 0) {
            const reason = (res as PromiseRejectedResult).reason;
            const msg = reason instanceof ApiError ? reason.message : reason instanceof Error ? reason.message : 'request failed';
            logError('admin', `list ${entity} failed: ${msg}`);
            setError(msg);
          }
        });
        setLoading(false);
      });
  }, [entity]);

  const handleClick = (id: unknown) => {
    route(`${backTo}/${entity}/${id}`);
  };

  const handleDelete = async (id: unknown, e: Event) => {
    e.stopPropagation();
    if (!confirm(t('admin.confirm_delete') || 'Delete this record?')) return;
    try {
      await deleteEntity(entity, String(id));
      setRows(prev => prev.filter(r => String(r[idKey]) !== String(id)));
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : err instanceof Error ? err.message : 'request failed';
      logError('admin', `delete ${entity}/${id} failed: ${msg}`);
      alert(`Delete failed: ${msg}`);
    }
  };

  const formatVal = (v: unknown, col: string) => {
    if (v === null || v === undefined) return '—';
    if (typeof v === 'boolean') return v ? '✓' : '✗';
    const s = String(v);
    if (col.toLowerCase().includes('id') && s.length > 8 && !s.includes('@')) {
      return <span title={s} style={{ cursor: 'help' }}>{s.substring(0, 4)}…{s.substring(s.length - 4)}</span>;
    }
    if (s.length > 60) return s.substring(0, 57) + '…';
    return s;
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
                  <tr key={String(row[idKey]) || idx} onClick={linkable ? () => handleClick(row[idKey]) : undefined} style={{ cursor: linkable ? 'pointer' : 'default' }}>
                    {columns.map(col => {
                      const raw = row[col];
                      const resolved = userColumns?.includes(col) && typeof raw === 'string' && userMap[raw] ? userMap[raw] : raw;
                      return <td key={col}>{formatVal(resolved, col)}</td>;
                    })}
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
