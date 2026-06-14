import { h } from 'preact';
import { useLanguage } from './i18n';
import AppShell from './AppShell';

export default function AdminPage() {
  const { t } = useLanguage();

  return (
    <AppShell currentPath="/admin" title={t('admin.title')}>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--sp-6)' }}>
        {t('admin.subtitle')}
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
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

        <a href="/adminer" target="_blank" rel="noopener noreferrer" class="admin-menu-card">
          <div class="admin-menu-icon">🗄</div>
          <div>
            <div class="admin-menu-title">{t('admin.db')}</div>
            <div class="admin-menu-desc">{t('admin.menu.db.desc')}</div>
          </div>
        </a>
      </div>
    </AppShell>
  );
}
