import { h } from 'preact';
import { useState } from 'preact/hooks';
import { useAuth } from './AuthProvider';
import { useLanguage } from './i18n';

export default function LoginPage({ onNavigate }: { onNavigate: (path: string) => void }) {
  document.title = `Sign In | Helping People`;
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { sendMagicLink } = useAuth();
  const { t } = useLanguage();

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    setError('');
    if (!email) { setError(t('auth.email.required')); return; }
    setSubmitting(true);
    const result = await sendMagicLink(email);
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
              <a href="/" class="logo" onClick={(e) => { e.preventDefault(); onNavigate('/'); }} style={{ cursor: 'pointer' }}>
                <span class="logo-mark">H</span>
                <span>Helping People</span>
              </a>
            </div>
            <div class="auth-sent">
              <div class="auth-sent-icon">✉️</div>
              <h2>{t('auth.magic.sent')}</h2>
              <p>
                {t('auth.magic.desc')} <strong>{email}</strong>
              </p>
              <p>{t('auth.magic.click')}</p>
              <p class="expires">{t('auth.magic.expires')}</p>
              <div style={{ marginTop: 'var(--sp-6)' }}>
                <button class="btn btn-ghost" onClick={() => { setSent(false); setEmail(''); }}>
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
            <a href="/" class="logo" onClick={(e) => { e.preventDefault(); onNavigate('/'); }} style={{ cursor: 'pointer' }}>
              <span class="logo-mark">H</span>
              <span>Helping People</span>
            </a>
            <h1>{t('auth.signin')}</h1>
            <p>{t('auth.signin.desc')}</p>
          </div>

          <form onSubmit={handleSubmit} class="auth-form">
            {error && <div class="auth-error">{error}</div>}
            <div class="field">
              <label class="field-label">{t('auth.email')}</label>
              <input
                class="input"
                type="email"
                placeholder="you@example.com"
                value={email}
                onInput={(e: any) => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>
            <button class="btn btn-primary" type="submit" disabled={submitting} style={{ width: '100%', padding: '12px' }}>
              {submitting && <span class="spinner" />}
              {submitting ? t('auth.sending') : t('auth.send.magic')}
            </button>
          </form>

          <div class="auth-footer">
            {t('auth.no.account')}{' '}
            <button onClick={() => onNavigate('/signup')}>{t('auth.signup.link')}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
