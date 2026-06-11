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
    console.log('[Auth] signup — sending magic link to:', email);
    const result = await sendMagicLink(email, name);
    setSubmitting(false);
    if (!result.ok) {
      setError(result.error);
      console.error('[Auth] signup failed:', result.error);
    } else {
      console.log('[Auth] magic link sent for signup');
      setSent(true);
    }
  };

  if (sent) {
    return (
      <div class="auth-page">
        <div class="auth-form auth-sent">
          <h2>{t('auth.magic.sent')}</h2>
          <p>
            {t('auth.magic.desc')} <strong>{email}</strong>.<br />
            {t('auth.magic.click.signup')}
          </p>
          <p style={{ fontSize: '0.85rem', color: '#5a5a68', marginTop: '0.5rem' }}>
            {t('auth.magic.expires')}
          </p>
          <button class="btn btn-ghost" onClick={() => { setSent(false); setEmail(''); setName(''); }}>
            {t('auth.try.again')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div class="auth-page">
      <form onSubmit={handleSubmit} class="auth-form">
        <h2>{t('auth.signup')}</h2>
        <p>{t('auth.signup.desc')}</p>
        {error && <p class="error">{error}</p>}
        <input class="input" type="text" placeholder={t('auth.name')} value={name} onInput={(e: any) => setName(e.target.value)} required />
        <input class="input" type="email" placeholder={t('auth.email')} value={email} onInput={(e: any) => setEmail(e.target.value)} required />
        <button class="btn btn-primary" type="submit" disabled={submitting}>{submitting ? t('auth.sending') : t('auth.send.magic')}</button>
        <p class="auth-link">
          {t('auth.has.account')} <a href="/login" onClick={(e) => { e.preventDefault(); onNavigate('/login'); }}>{t('auth.signin.link')}</a>
        </p>
      </form>
    </div>
  );
}
