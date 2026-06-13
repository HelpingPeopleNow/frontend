import { h } from 'preact';
import { route } from 'preact-router';
import { useLanguage } from './i18n';

export default function ModeChooser() {
  const { t } = useLanguage();

  const modes = [
    {
      mode: 'worker_intake',
      icon: '🔧',
      label: t('chooser.worker.label'),
      desc: t('chooser.worker.desc'),
      route: '/chat?mode=worker_intake',
    },
    {
      mode: 'client_intake',
      icon: '🏠',
      label: t('chooser.client.label'),
      desc: t('chooser.client.desc'),
      route: '/chat?mode=client_intake',
    },
    {
      mode: 'search',
      icon: '🔍',
      label: t('chooser.search.label'),
      desc: t('chooser.search.desc'),
      route: '/find',
    },
  ];

  return (
    <div class="chooser-container">
      <div class="chooser-header">
        <div class="chooser-icon">💬</div>
        <h2 class="chooser-title">{t('chooser.title')}</h2>
        <p class="chooser-desc">{t('chooser.desc')}</p>
      </div>
      <div class="chooser-grid">
        {modes.map(m => (
          <button
            key={m.mode}
            class="chooser-card"
            onClick={() => route(m.route, true)}
          >
            <div class="chooser-card-icon">{m.icon}</div>
            <div class="chooser-card-label">{m.label}</div>
            <div class="chooser-card-desc">{m.desc}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
