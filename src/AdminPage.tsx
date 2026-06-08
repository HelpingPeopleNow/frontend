import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';

const API = '/api';

interface SystemPrompts {
  helper_prompt: string;
  [key: string]: string;
}

interface PromptMeta {
  key: string;
  label: string;
  desc: string;
}

export default function AdminPage() {
  const [prompts, setPrompts] = useState<SystemPrompts | null>(null);
  const [editing, setEditing] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch(`${API}/v1/system-prompts`)
      .then(r => r.json())
      .then((data: SystemPrompts) => {
        setPrompts(data);
        setEditing({ helper_prompt: data.helper_prompt || '' });
      })
      .catch(() => setMessage('Failed to load prompts'));
  }, []);

  const handleSave = async (col: string) => {
    setSaving(col);
    try {
      const res = await fetch(`${API}/v1/system-prompts/${col.replace('_prompt', '')}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editing[col] }),
      });
      const data = await res.json();
      setMessage(res.ok ? `✅ ${col} updated` : `❌ ${data.error || 'update failed'}`);
    } catch (err: unknown) {
      setMessage(`❌ ${err instanceof Error ? err.message : 'request failed'}`);
    } finally {
      setSaving(null);
    }
  };

  const promptMeta: PromptMeta[] = [
    { key: 'helper_prompt', label: 'Helper Prompt', desc: 'System prompt for the helper service' },
  ];

  return (
    <div style={{
      minHeight: '100vh', fontFamily: 'system-ui, sans-serif', background: '#1a1a2e', color: '#e0e0e0', padding: '2rem',
    } as h.JSX.CSSProperties}>
      <h2 style={{ fontSize: '1.8rem', color: '#fff' }}>🛠 System Prompts</h2>
      <p style={{ margin: '0 0 2rem', color: '#888' }}>Edit prompts below.</p>

      {message && <div style={{ marginBottom: '1rem', padding: '0.5rem 1rem', background: '#16213e', borderRadius: '6px' }}>{message}</div>}

      {prompts === null ? <p>Loading...</p> : (
        <div style={{ maxWidth: '800px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {promptMeta.map(({ key, label, desc }) => (
            <div key={key} style={{ background: '#16213e', borderRadius: '10px', padding: '1.5rem', border: '1px solid #0f3460' }}>
              <div style={{ marginBottom: '0.5rem' }}>
                <strong style={{ color: '#00d4ff' }}>{label}</strong>
                <span style={{ marginLeft: '0.75rem', fontSize: '0.8rem', color: '#666' }}>{desc}</span>
              </div>
              <textarea
                value={editing[key] || ''}
                onChange={(e) => setEditing({ ...editing, [key]: e.currentTarget.value })}
                rows={5}
                style={{ width: '100%', padding: '0.75rem', fontFamily: 'monospace', background: '#1a1a2e', color: '#e0e0e0', border: '1px solid #0f3460', borderRadius: '6px' }}
              />
              <div style={{ textAlign: 'right', marginTop: '0.5rem' }}>
                <button onClick={() => handleSave(key)} disabled={saving === key}
                  style={{ padding: '0.5rem 1.5rem', border: 'none', borderRadius: '6px', background: saving === key ? '#555' : '#00d4ff', color: '#1a1a2e', cursor: 'pointer' }}>
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