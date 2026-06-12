import { h } from 'preact';
import { useState } from 'preact/hooks';
import { useAuth } from './AuthProvider';
import { useLanguage } from './i18n';

export default function SignupPage({ onNavigate }: { onNavigate: (path: string) => void }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { sendMagicLink } = useAuth();
  const { t } = useLanguage();

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    setError('');
    if (!name || !email) { setError(t('auth.name.email.required')); return; }
    setSubmitting(true);
    const result = await sendMagicLink(email, name);
    setSubmitting(false);
    if (!result.ok) {
      setError(result.error || 'Unknown error');
    } else {
      setSent(true);
    }
  };

  if (sent) {
    return (
      <div class="auth-layout">
        <div class="auth-panel">
          <div class="auth-card">
            <div class="auth-card-header">
              <div class="logo">
                <span class="logo-mark">H</span>
                <span>HelpingPeopleNow</span>
              </div>
            </div>
            <div class="auth-sent">
              <div class="auth-sent-icon">✉️</div>
              <h2>{t('auth.magic.sent')}</h2>
              <p>
                {t('auth.magic.desc')} <strong>{email}</strong>
              </p>
              <p>{t('auth.magic.click.signup')}</p>
              <p class="expires">{t('auth.magic.expires')}</p>
              <div style={{ marginTop: 'var(--sp-6)' }}>
                <button class="btn btn-ghost" onClick={() => { setSent(false); setEmail(''); setName(''); }}>
                  {t('auth.send.again')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div class="auth-layout">
      <div class="auth-panel">
        <div class="auth-card">
          <div class="auth-card-header">
            <div class="logo">
              <span class="logo-mark">H</span>
              <span>HelpingPeopleNow</span>
            </div>
            <h1>{t('auth.signup')}</h1>
            <p>{t('auth.signup.desc')}</p>
          </div>

          <form onSubmit={handleSubmit} class="auth-form">
            {error && <div class="auth-error">{error}</div>}
            <div class="field">
              <label class="field-label">{t('auth.name')}</label>
              <input
                class="input"
                type="text"
                placeholder="Your name"
                value={name}
                onInput={(e: any) => setName(e.target.value)}
                required
                autoFocus
              />
            </div>
            <div class="field">
              <label class="field-label">{t('auth.email')}</label>
              <input
                class="input"
                type="email"
                placeholder="you@example.com"
                value={email}
                onInput={(e: any) => setEmail(e.target.value)}
                required
              />
            </div>
            <button class="btn btn-primary" type="submit" disabled={submitting} style={{ width: '100%', padding: '12px' }}>
              {submitting && <span class="spinner" />}
              {submitting ? t('auth.sending') : t('auth.send.magic')}
            </button>
          </form>

          <div class="auth-footer">
            {t('auth.has.account')}{' '}
            <button onClick={() => onNavigate('/login')}>{t('auth.signin.link')}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
