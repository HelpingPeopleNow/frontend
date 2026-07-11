import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { useAuth } from './AuthProvider';
import { useLanguage } from './i18n';
import 'cap-widget';

export default function LoginPage({ onNavigate }: { onNavigate: (path: string) => void }) {
  document.title = `Sign In | Helping People`;
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [capToken, setCapToken] = useState<string | null>(null);
  const { sendMagicLink } = useAuth();
  const { t } = useLanguage();

  useEffect(() => {
    const widget = document.querySelector('cap-widget');
    if (widget) {
      const handleSolve = (e: CustomEvent<{ token: string }>) => {
        setCapToken(e.detail.token);
      };
      widget.addEventListener('solve', handleSolve);
      return () => widget.removeEventListener('solve', handleSolve);
    }
  }, []);

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    setError('');
    if (!email) { setError(t('auth.email.required')); return; }

    if (!capToken) {
      setError(t('auth.captcha.required'));
      return;
    }

    setSubmitting(true);
    const result = await sendMagicLink(email, capToken);
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
            <h1>{t('auth.signin.or_create')}</h1>
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

            <div class="captcha-widget">
              <cap-widget
                data-cap-api-endpoint="https://cap.helpingpeople.cloud/0a4189abe8/"
                data-cap-hidden-field-name="cap-token"
              />
            </div>

            <button class="btn btn-primary" type="submit" disabled={submitting || !capToken} style={{ width: '100%', padding: '12px' }}>
              {submitting && <span class="spinner" />}
              {submitting ? t('auth.sending') : t('auth.send.magic')}
            </button>
          </form>

          <div class="auth-footer">
            <p class="auth-footer-note">{t('auth.no.password')}</p>
            <div class="auth-footer-legal">
              <a href="/terms">{t('legal.terms')}</a>
              <a href="/privacy">{t('legal.privacy')}</a>
              <a href="/cookies">{t('legal.cookies')}</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
