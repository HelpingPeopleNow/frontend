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
        <div class="auth-form" style={{ textAlign: 'center' }}>
          <h2>{t('auth.magic.sent')}</h2>
          <p style={{ color: '#aaa', lineHeight: 1.6 }}>
            {t('auth.magic.desc')} <strong style={{ color: '#00d4ff' }}>{email}</strong>.<br />
            {t('auth.magic.click.signup')}
          </p>
          <p style={{ fontSize: '0.85rem', color: '#666', marginTop: '1rem' }}>
            {t('auth.magic.expires')}
          </p>
          <button onClick={() => { setSent(false); setEmail(''); setName(''); }}
            style={{ marginTop: '1rem', padding: '0.5rem 1rem', background: 'transparent', color: '#4a6cf7', border: '1px solid #4a6cf7', borderRadius: '4px', cursor: 'pointer' }}>
            {t('auth.try.again')}
          </button>
        </div>
        <style>{`
          .auth-page { display: flex; justify-content: center; align-items: center; min-height: 80vh; }
          .auth-form { background: #1a1a2e; padding: 2rem; border-radius: 8px; width: 100%; max-width: 360px; display: flex; flex-direction: column; gap: 1rem; }
          .auth-form h2 { margin: 0; text-align: center; color: #e0e0ff; }
        `}</style>
      </div>
    );
  }

  return (
    <div class="auth-page">
      <form onSubmit={handleSubmit} class="auth-form">
        <h2>{t('auth.signup')}</h2>
        <p style={{ color: '#888', fontSize: '0.85rem', textAlign: 'center', margin: 0 }}>
          {t('auth.signup.desc')}
        </p>
        {error && <p class="error">{error}</p>}
        <input type="text" placeholder={t('auth.name')} value={name} onInput={(e: any) => setName(e.target.value)} required />
        <input type="email" placeholder={t('auth.email')} value={email} onInput={(e: any) => setEmail(e.target.value)} required />
        <button type="submit" disabled={submitting}>{submitting ? t('auth.sending') : t('auth.send.magic')}</button>
        <p class="auth-link">
          {t('auth.has.account')} <a href="/login" onClick={(e) => { e.preventDefault(); onNavigate('/login'); }}>{t('auth.signin.link')}</a>
        </p>
      </form>
      <style>{`
        .auth-page { display: flex; justify-content: center; align-items: center; min-height: 80vh; }
        .auth-form { background: #1a1a2e; padding: 2rem; border-radius: 8px; width: 100%; max-width: 360px; display: flex; flex-direction: column; gap: 1rem; }
        .auth-form h2 { margin: 0; text-align: center; color: #e0e0ff; }
        .auth-form input { padding: 0.75rem; border: 1px solid #333; border-radius: 4px; background: #16213e; color: #e0e0ff; font-size: 1rem; }
        .auth-form button { padding: 0.75rem; background: #4a6cf7; color: white; border: none; border-radius: 4px; font-size: 1rem; cursor: pointer; }
        .auth-form button:disabled { opacity: 0.6; }
        .auth-form .error { color: #ff6b6b; font-size: 0.9rem; text-align: center; margin: 0; }
        .auth-link { text-align: center; font-size: 0.9rem; color: #888; }
        .auth-link a { color: #4a6cf7; text-decoration: none; }
      `}</style>
    </div>
  );
}
