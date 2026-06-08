import { h } from 'preact';
import { useState } from 'preact/hooks';
import { useAuth } from './AuthProvider';

export default function SignupPage({ onNavigate }: { onNavigate: (path: string) => void }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { signup } = useAuth();

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    setError('');
    if (!name || !email || !password) { setError('All fields are required'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters'); return; }
    setSubmitting(true);
    console.log('[Auth] signup attempt:', email);
    const result = await signup(name, email, password);
    setSubmitting(false);
    if (!result.ok) {
      setError(result.error);
      console.error('[Auth] signup failed:', result.error);
    } else {
      console.log('[Auth] signup ok, redirecting to /');
      setTimeout(() => onNavigate('/'), 50);
    }
  };

  return (
    <div class="auth-page">
      <form onSubmit={handleSubmit} class="auth-form">
        <h2>Create Account</h2>
        {error && <p class="error">{error}</p>}
        <input type="text" placeholder="Name" value={name} onInput={(e: any) => setName(e.target.value)} required />
        <input type="email" placeholder="Email" value={email} onInput={(e: any) => setEmail(e.target.value)} required />
        <input type="password" placeholder="Password (8+ chars)" value={password} onInput={(e: any) => setPassword(e.target.value)} required />
        <button type="submit" disabled={submitting}>{submitting ? 'Creating account...' : 'Sign Up'}</button>
        <p class="auth-link">
          Already have an account? <a href="/login" onClick={(e) => { e.preventDefault(); onNavigate('/login'); }}>Sign in</a>
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
