import { h } from 'preact';
import { useState } from 'preact/hooks';
import { useAuth } from './AuthProvider';

export default function LoginPage({ onNavigate }: { onNavigate: (path: string) => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    setError('');
    if (!email || !password) { setError('Email and password are required'); return; }
    setSubmitting(true);
    console.log('[Auth] login attempt:', email);
    const result = await login(email, password);
    setSubmitting(false);
    if (!result.ok) {
      setError(result.error);
      console.error('[Auth] login failed:', result.error);
    } else {
      console.log('[Auth] login ok, redirecting to /');
      setTimeout(() => onNavigate('/'), 50);
    }
  };

  return (
    <div class="auth-page">
      <form onSubmit={handleSubmit} class="auth-form">
        <h2>Sign In</h2>
        {error && <p class="error">{error}</p>}
        <input type="email" placeholder="Email" value={email} onInput={(e: any) => setEmail(e.target.value)} required />
        <input type="password" placeholder="Password" value={password} onInput={(e: any) => setPassword(e.target.value)} required />
        <button type="submit" disabled={submitting}>{submitting ? 'Signing in...' : 'Sign In'}</button>
        <p class="auth-link">
          Don't have an account? <a href="/signup" onClick={(e) => { e.preventDefault(); onNavigate('/signup'); }}>Sign up</a>
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
