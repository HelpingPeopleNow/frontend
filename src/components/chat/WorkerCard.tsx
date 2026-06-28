import { h } from 'preact';
import { route } from 'preact-router';
import { useLanguage } from '../../i18n';
import { WorkerCard as WorkerCardData } from '../../services/chat';

interface Props {
  worker: WorkerCardData;
}

export default function WorkerCard({ worker }: Props) {
  const { t } = useLanguage();
  return (
    <div class="worker-card" onClick={() => route(`/workers/${worker.id}`, false)} style={{ cursor: 'pointer' }}>
      <div class="worker-card-header">
        <span class="worker-card-name">{worker.business_name || worker.profession}</span>
        <span class="worker-card-rate">€{worker.hourly_rate}/hr</span>
      </div>
      <div class="worker-card-meta">
        {worker.profession} · {worker.city} · {worker.years_experience} {t('worker.card.years_exp')}
      </div>
      {worker.bio && <div class="worker-card-bio">{worker.bio}</div>}
      <div class="worker-card-badges">
        {worker.has_insurance && <span class="worker-badge worker-badge-insured">✓ {t('client.find.badge.insured')}</span>}
        {worker.emergency_service && <span class="worker-badge worker-badge-emergency">⚡ {t('client.find.badge.emergency')}</span>}
        {worker.free_estimate && <span class="worker-badge worker-badge-estimate">📋 {t('client.find.badge.free_estimate')}</span>}
      </div>
      <div class="worker-card-actions">
        <button
          class="worker-card-btn-primary"
          onClick={(e) => { e.stopPropagation(); route(`/workers/${worker.id}`, false); }}
        >
          💬 {t('profile.chat_now')}
        </button>
        {worker.slug && (
          <button
            class="worker-card-btn-secondary"
            onClick={(e) => { e.stopPropagation(); route(`/profile/${worker.slug}`, false); }}
          >
            👁 {t('profile.view_profile')}
          </button>
        )}
      </div>
    </div>
  );
}
