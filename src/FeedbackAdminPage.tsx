import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { route } from 'preact-router';
import { log, logError } from './lib/logger';
import AppShell from './AppShell';
import { ApiError } from './services/api';

interface FeedbackItem {
  id: string;
  user_id: string;
  page_url: string;
  message: string;
  category: string;
  status: string;
  admin_note: string | null;
  created_at: string;
  updated_at: string;
}

const STATUS_OPTIONS = ['open', 'in_progress', 'resolved', 'dismissed'];
const CATEGORY_EMOJI: Record<string, string> = {
  bug: '🐛', idea: '💡', complaint: '😤', general: '💬',
};

export default function FeedbackAdminPage() {
  document.title = 'Admin - Feedback | Helping People';
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    log('feedback', 'admin page mount');
    fetchItems();
  }, [statusFilter]);

  const fetchItems = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ limit: '200' });
      if (statusFilter) params.set('status', statusFilter);
      const res = await fetch(`/api/v1/admin/feedback?${params}`, {
        credentials: 'include',
        signal: AbortSignal.timeout(15000),
      });
      if (!res.ok) throw new ApiError(res.status, `Failed to load feedback`);
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
      log('feedback', 'admin list ok', { count: Array.isArray(data) ? data.length : 0, statusFilter });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'request failed';
      logError('admin', `list feedback failed: ${msg}`);
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/v1/admin/feedback?id=${id}&status=${status}`, {
        method: 'PUT',
        credentials: 'include',
        signal: AbortSignal.timeout(10000),
      });
      if (!res.ok) throw new ApiError(res.status, 'Update failed');
      setItems(prev =>
        prev.map(item => (item.id === id ? { ...item, status } : item))
      );
      log('feedback', 'admin status update ok', { id, status });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'update failed';
      logError('admin', `update feedback ${id} failed: ${msg}`);
      alert(`Update failed: ${msg}`);
    }
  };

  const statusColor = (s: string) => {
    switch (s) {
      case 'open': return 'var(--warning, #f59e0b)';
      case 'in_progress': return 'var(--accent, #06b6d4)';
      case 'resolved': return 'var(--success, #10b981)';
      case 'dismissed': return 'var(--text-muted, #4a5568)';
      default: return 'var(--text-muted, #4a5568)';
    }
  };

  const statusBg = (s: string) => {
    switch (s) {
      case 'open': return 'var(--warning-subtle, rgba(245,158,11,0.12))';
      case 'in_progress': return 'var(--accent-subtle, rgba(6,182,212,0.12))';
      case 'resolved': return 'var(--success-subtle, rgba(16,185,129,0.12))';
      case 'dismissed': return 'rgba(255,255,255,0.04)';
      default: return 'rgba(255,255,255,0.04)';
    }
  };

  return (
    <AppShell currentPath="/admin/feedback" title="Feedback">
      <div class="admin-page">
        <div class="admin-header">
          <a href="/admin" class="back-link">← Admin</a>
          <h1>💬 Feedback</h1>
          <div class="feedback-filters">
            <select
              class="select"
              value={statusFilter}
              onChange={(e: any) => setStatusFilter(e.target.value)}
            >
              <option value="">All statuses</option>
              {STATUS_OPTIONS.map(s => (
                <option key={s} value={s}>{s.replace('_', ' ')}</option>
              ))}
            </select>
            <button class="btn btn-ghost btn-sm" onClick={fetchItems}>↻ Refresh</button>
          </div>
        </div>

        {loading && <div class="loading"><div class="spinner" /></div>}
        {error && <div class="error-banner">{error}</div>}

        {!loading && items.length === 0 && (
          <div class="empty-state">No feedback found.</div>
        )}

        {!loading && items.length > 0 && (
          <div class="feedback-list">
            {items.map(item => (
              <div key={item.id} class="feedback-card">
                <div class="feedback-card-header">
                  <span class="feedback-category">
                    {CATEGORY_EMOJI[item.category] || '💬'} {item.category}
                  </span>
                  <span
                    class="feedback-status"
                    style={{ color: statusColor(item.status), background: statusBg(item.status), padding: '2px 8px', borderRadius: '9999px', fontSize: '11px', fontWeight: 600 }}
                  >
                    {item.status.replace('_', ' ')}
                  </span>
                  <span class="feedback-date">
                    {new Date(item.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p class="feedback-message">{item.message}</p>
                <div class="feedback-card-footer">
                  <a
                    class="feedback-page-link"
                    href={item.page_url}
                    target="_blank"
                    rel="noopener"
                  >
                    {item.page_url}
                  </a>
                  <span class="feedback-user" title={item.user_id}>
                    user: {item.user_id.substring(0, 8)}…
                  </span>
                </div>
                <div class="feedback-actions">
                  {STATUS_OPTIONS.map(s => (
                    <button
                      key={s}
                      class={`feedback-action-btn status-${s} ${item.status === s ? 'active' : ''}`}
                      onClick={() => updateStatus(item.id, s)}
                    >
                      {s.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        .feedback-filters {
          display: flex;
          gap: 8px;
          align-items: center;
        }
        .feedback-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-top: 16px;
        }
        .feedback-card {
          background: var(--surface-2);
          border: 1px solid var(--border);
          border-radius: 10px;
          padding: 14px;
        }
        .feedback-card-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 8px;
          font-size: 13px;
        }
        .feedback-category {
          font-weight: 600;
          text-transform: capitalize;
        }
        .feedback-status {
          font-weight: 600;
          text-transform: capitalize;
        }
        .feedback-date {
          margin-left: auto;
          color: var(--text-secondary);
          font-size: 12px;
        }
        .feedback-message {
          margin: 0 0 8px;
          font-size: 14px;
          line-height: 1.5;
          color: var(--text);
          white-space: pre-wrap;
          word-break: break-word;
        }
        .feedback-card-footer {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 12px;
          margin-bottom: 8px;
        }
        .feedback-page-link {
          color: var(--accent);
          text-decoration: none;
          max-width: 300px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .feedback-page-link:hover { text-decoration: underline; }
        .feedback-user {
          color: var(--text-secondary);
          font-family: monospace;
        }
        .feedback-actions {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
        }
        .feedback-action-btn {
          background: var(--surface);
          border: 1px solid var(--border-strong);
          border-radius: var(--r-sm);
          padding: 4px 12px;
          font-size: var(--text-xs);
          font-weight: 500;
          cursor: pointer;
          color: var(--text-secondary);
          text-transform: capitalize;
          transition: all 0.15s var(--ease);
        }
        .feedback-action-btn:hover {
          background: var(--surface-hover);
          border-color: var(--accent);
          color: var(--text);
        }
        .feedback-action-btn.active {
          font-weight: 600;
          color: #fff;
          border-color: transparent;
        }
        .feedback-action-btn.status-open.active { background: var(--warning); }
        .feedback-action-btn.status-in_progress.active { background: var(--accent); }
        .feedback-action-btn.status-resolved.active { background: var(--success); }
        .feedback-action-btn.status-dismissed.active { background: var(--text-muted); }
        .empty-state {
          text-align: center;
          padding: 40px;
          color: var(--text-secondary);
        }
        .error-banner {
          background: var(--error-bg, rgba(239, 68, 68, 0.1));
          border: 1px solid var(--error, #ef4444);
          border-radius: 8px;
          padding: 10px 14px;
          color: var(--error, #ef4444);
          margin-top: 12px;
        }
      `}</style>
    </AppShell>
  );
}
