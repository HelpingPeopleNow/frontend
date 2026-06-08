import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';

function Home({ onNavigate }) {
  const [prompts, setPrompts] = useState(null);
  const [editing, setEditing] = useState({});
  const [saving, setSaving] = useState(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch('/api/v1/prompts')
      .then(r => r.json())
      .then(data => {
        setPrompts(data);
        setEditing({
          helper_prompt: data.helper_prompt,
          frontend_prompt: data.frontend_prompt,
          backend_prompt: data.backend_prompt,
        });
      })
      .catch(() => setMessage('Failed to load prompts'));
  }, []);

  const handleHello = async () => {
    try {
      const res = await fetch('/api/v1/hello');
      const data = await res.json();
      alert(data.message);
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const handleSave = async (col) => {
    setSaving(col);
    try {
      const res = await fetch(`/api/v1/prompts/${col.replace('_prompt', '')}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editing[col] }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage(`✅ ${col} updated`);
      } else {
        setMessage(`❌ ${data.error || 'update failed'}`);
      }
    } catch (err) {
      setMessage(`❌ ${err.message}`);
    } finally {
      setSaving(null);
    }
  };

  const promptMeta = [
    { key: 'helper_prompt', label: 'Helper Prompt', desc: 'System prompt for the pizza assistant (helper service)' },
    { key: 'frontend_prompt', label: 'Frontend Prompt', desc: 'System prompt for the frontend service' },
    { key: 'backend_prompt', label: 'Backend Prompt', desc: 'System prompt for the backend service' },
  ];

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      minHeight: '100vh',
      fontFamily: 'system-ui, sans-serif',
      background: '#1a1a2e',
      color: '#e0e0e0',
      padding: '2rem 1rem',
    }}>
      {/* Hero */}
      <h1 style={{ fontSize: '4rem', margin: '0 0 0.5rem', color: '#00d4ff' }}>
        hi hermy, p
      </h1>

      <button onClick={handleHello} style={{
        padding: '1rem 2.5rem',
        fontSize: '1.2rem',
        border: 'none',
        borderRadius: '8px',
        background: '#00d4ff',
        color: '#1a1a2e',
        cursor: 'pointer',
        fontWeight: 600,
        marginBottom: '3rem',
      }}>
        Say Hello
      </button>

      {/* Prompts Admin */}
      <h2 style={{ fontSize: '1.8rem', margin: '0 0 0.25rem', color: '#fff' }}>
        🛠 System Prompts
      </h2>
      <p style={{ margin: '0 0 2rem', fontSize: '0.9rem', color: '#888' }}>
        Each column in the database is a different service's system prompt.
        Edit any prompt below — changes take effect immediately.
      </p>

      {message && (
        <div style={{
          background: message.startsWith('✅') ? '#1b4332' : '#4a1a1a',
          color: message.startsWith('✅') ? '#52e0a0' : '#ff7b7b',
          padding: '0.6rem 1.2rem',
          borderRadius: '6px',
          marginBottom: '1.5rem',
          fontSize: '0.9rem',
        }}>
          {message}
          <button onClick={() => setMessage('')} style={{
            marginLeft: '1rem',
            background: 'none',
            border: 'none',
            color: '#888',
            cursor: 'pointer',
          }}>✕</button>
        </div>
      )}

      {prompts === null ? (
        <p>Loading prompts...</p>
      ) : (
        <div style={{ width: '100%', maxWidth: '800px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {promptMeta.map(({ key, label, desc }) => (
            <div key={key} style={{
              background: '#16213e',
              borderRadius: '10px',
              padding: '1.5rem',
              border: '1px solid #0f3460',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <div>
                  <strong style={{ fontSize: '1.1rem', color: '#00d4ff' }}>{label}</strong>
                  <span style={{ marginLeft: '0.75rem', fontSize: '0.8rem', color: '#666' }}>{desc}</span>
                </div>
              </div>
              <textarea
                value={editing[key] || ''}
                onChange={(e) => setEditing({ ...editing, [key]: e.target.value })}
                rows={5}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  fontSize: '0.9rem',
                  fontFamily: 'monospace',
                  background: '#1a1a2e',
                  color: '#e0e0e0',
                  border: '1px solid #0f3460',
                  borderRadius: '6px',
                  resize: 'vertical',
                  boxSizing: 'border-box',
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button
                  onClick={() => handleSave(key)}
                  disabled={saving === key}
                  style={{
                    padding: '0.5rem 1.5rem',
                    fontSize: '0.9rem',
                    border: 'none',
                    borderRadius: '6px',
                    background: saving === key ? '#555' : '#00d4ff',
                    color: '#1a1a2e',
                    cursor: saving === key ? 'not-allowed' : 'pointer',
                    fontWeight: 600,
                  }}
                >
                  {saving === key ? 'Saving...' : `Save ${label}`}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function App() {
  return <Home onNavigate={() => {}} />;
}
