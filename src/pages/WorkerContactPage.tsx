import { h } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { route } from 'preact-router';
import { logError } from '../lib/logger';
import { useLanguage } from '../i18n';
import { getContact } from '../lib/directMessageApi';

interface Props {
  workerId: string;
}

export default function WorkerContactPage({ workerId }: Props) {
  const { t } = useLanguage();
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    getContact(workerId)
      .then(data => {
        if (!cancelled && data.conversation_id) {
          route(`/inbox/${data.conversation_id}`, true);
        }
      })
      .catch(err => {
        logError('dm', `getContact ${workerId} failed: ${err?.message || String(err)}`);
        if (!cancelled) setError(err.message || t('dm.contact.error'));
      });
    return () => { cancelled = true; };
  }, [workerId]);

  if (error) {
    return (
      <div class="dm-empty" style={{ padding: 'var(--sp-6)', textAlign: 'center' }}>
        <div class="dm-empty-icon">⚠️</div>
        <h3>{t('dm.contact.error.title')}</h3>
        <p>{error}</p>
        <button class="btn btn-primary" onClick={() => route('/find', false)}>
          {t('dm.contact.back')}
        </button>
      </div>
    );
  }

  return (
    <div class="loading" style={{ padding: 'var(--sp-6)' }}>
      <div class="spinner" />
      <p style={{ marginTop: 'var(--sp-3)', color: 'var(--text-muted)' }}>
        {t('dm.contact.loading')}
      </p>
    </div>
  );
}
