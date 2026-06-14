import { h } from 'preact';
import { useLanguage } from './i18n';
import AppShell from './AppShell';

export default function AdminPage() {
  const { t } = useLanguage();

  return (
    <AppShell currentPath="/admin" title="Admin">
      <div class="admin-page">
        <h2 class="section-title" style={{ marginBottom: 'var(--sp-2)' }}>{t('admin.title')}</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--sp-6)' }}>
          {t('admin.subtitle')}
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
          {/* System */}
          <a href="/admin/llm" class="admin-menu-card">
            <div class="admin-menu-icon">🤖</div>
            <div>
              <div class="admin-menu-title">{t('admin.menu.llm')}</div>
              <div class="admin-menu-desc">{t('admin.menu.llm.desc')}</div>
            </div>
          </a>

          <a href="/admin/prompts" class="admin-menu-card">
            <div class="admin-menu-icon">💬</div>
            <div>
              <div class="admin-menu-title">{t('admin.menu.prompts')}</div>
              <div class="admin-menu-desc">{t('admin.menu.prompts.desc')}</div>
            </div>
          </a>

          {/* Entities */}
          <a href="/admin/users" class="admin-menu-card">
            <div class="admin-menu-icon">👤</div>
            <div>
              <div class="admin-menu-title">Users</div>
              <div class="admin-menu-desc">View, edit and delete registered users</div>
            </div>
          </a>

          <a href="/admin/worker-profiles" class="admin-menu-card">
            <div class="admin-menu-icon">🔧</div>
            <div>
              <div class="admin-menu-title">Workers</div>
              <div class="admin-menu-desc">Manage worker profiles and tradespeople</div>
            </div>
          </a>

          <a href="/admin/client-profiles" class="admin-menu-card">
            <div class="admin-menu-icon">🏠</div>
            <div>
              <div class="admin-menu-title">Clients</div>
              <div class="admin-menu-desc">Manage client profiles and home owners</div>
            </div>
          </a>

          <a href="/admin/conversations" class="admin-menu-card">
            <div class="admin-menu-icon">💭</div>
            <div>
              <div class="admin-menu-title">Conversations</div>
              <div class="admin-menu-desc">View chat conversations and metadata</div>
            </div>
          </a>

          <a href="/admin/messages" class="admin-menu-card">
            <div class="admin-menu-icon">📨</div>
            <div>
              <div class="admin-menu-title">Messages</div>
              <div class="admin-menu-desc">Browse individual chat messages</div>
            </div>
          </a>

          {/* Tools */}
          <a href="/adminer" target="_blank" rel="noopener noreferrer" class="admin-menu-card">
            <div class="admin-menu-icon">🗄</div>
            <div>
              <div class="admin-menu-title">{t('admin.db')}</div>
              <div class="admin-menu-desc">{t('admin.menu.db.desc')}</div>
            </div>
          </a>
        </div>
      </div>
    </AppShell>
  );
}
