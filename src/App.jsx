import { h } from 'preact';
import { useState, useEffect, useRef } from 'preact/hooks';

const API = 'http://51.92.201.150:8081/api';

function Home({ onNavigate }) {
  const [prompts, setPrompts] = useState(null);
  const [editing, setEditing] = useState({});
  const [saving, setSaving] = useState(null);
  const [message, setMessage] = useState('');

  // Chat state
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef(null);
  const chatInputRef = useRef(null);

  useEffect(() => {
    fetch(`${API}/v1/system-prompts`)
      .then(r => r.json())
      .then(data => {
        setPrompts(data);
        setEditing({
          helper_prompt: data.helper_prompt || '',
        });
      })
      .catch(() => setMessage('Failed to load prompts'));
  }, []);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleSave = async (col) => {
    setSaving(col);
    try {
      const res = await fetch(`${API}/v1/system-prompts/${col.replace('_prompt', '')}`, {
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

  const handleSend = async () => {
    const text = chatInput.trim();
    if (!text || chatLoading) return;

    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', text }]);
    setChatLoading(true);

    try {
      const res = await fetch(`${API}/v1/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: chatMessages.map(m => ({ role: m.role, content: m.text }))
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setChatMessages(prev => [...prev, { role: 'assistant', text: data.answer }]);
      } else {
        setChatMessages(prev => [...prev, { role: 'assistant', text: `❌ Error: ${data.error || 'request failed'}` }]);
      }
    } catch (err) {
      setChatMessages(prev => [...prev, { role: 'assistant', text: `❌ Error: ${err.message}` }]);
    } finally {
      setChatLoading(false);
      chatInputRef.current?.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const promptMeta = [
    { key: 'helper_prompt', label: 'Helper Prompt', desc: 'System prompt for the helper service' },
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

      {/* Chat Section */}
      <div style={{ width: '100%', maxWidth: '800px', marginBottom: '3rem' }}>
        <h2 style={{ fontSize: '1.8rem', margin: '0 0 0.25rem', color: '#fff' }}>
          💬 Chat
        </h2>
        <p style={{ margin: '0 0 1rem', fontSize: '0.9rem', color: '#888' }}>
          Ask anything — the assistant will answer based on its system prompt.
        </p>

        {/* Chat messages */}
        <div style={{
          background: '#16213e',
          borderRadius: '10px',
          padding: '1.25rem',
          border: '1px solid #0f3460',
          minHeight: '200px',
          maxHeight: '400px',
          overflowY: 'auto',
          marginBottom: '0.75rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
        }}>
          {chatMessages.length === 0 && (
            <p style={{ color: '#555', textAlign: 'center', margin: '3rem 0' }}>
              No messages yet. Ask a question below.
            </p>
          )}
          {chatMessages.map((msg, i) => (
            <div key={i} style={{
              alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '80%',
              padding: '0.65rem 1rem',
              borderRadius: '12px',
              background: msg.role === 'user' ? '#0f3460' : '#1a1a2e',
              border: msg.role === 'user' ? 'none' : '1px solid #0f3460',
              color: '#e0e0e0',
              fontSize: '0.95rem',
              lineHeight: '1.5',
              whiteSpace: 'pre-wrap',
            }}>
              <div style={{ fontSize: '0.75rem', color: '#888', marginBottom: '0.25rem' }}>
                {msg.role === 'user' ? 'You' : 'Assistant'}
              </div>
              {msg.text}
            </div>
          ))}
          {chatLoading && (
            <div style={{
              alignSelf: 'flex-start',
              padding: '0.65rem 1rem',
              borderRadius: '12px',
              background: '#1a1a2e',
              border: '1px solid #0f3460',
              color: '#888',
              fontSize: '0.95rem',
            }}>
              Thinking...
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Chat input */}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <textarea
            ref={chatInputRef}
            autoFocus
            value={chatInput}
            onInput={(e) => setChatInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask something..."
            rows={2}
            disabled={chatLoading}
            style={{
              flex: 1,
              padding: '0.75rem',
              fontSize: '0.95rem',
              fontFamily: 'inherit',
              background: '#1a1a2e',
              color: '#e0e0e0',
              border: '1px solid #0f3460',
              borderRadius: '8px',
              resize: 'none',
              boxSizing: 'border-box',
            }}
          />
          <button
            onClick={handleSend}
            disabled={chatLoading || !chatInput.trim()}
            style={{
              padding: '0.75rem 1.5rem',
              fontSize: '1rem',
              border: 'none',
              borderRadius: '8px',
              background: chatLoading || !chatInput.trim() ? '#555' : '#00d4ff',
              color: '#1a1a2e',
              cursor: chatLoading || !chatInput.trim() ? 'not-allowed' : 'pointer',
              fontWeight: 600,
              alignSelf: 'stretch',
            }}
          >
            {chatLoading ? '...' : 'Send'}
          </button>
        </div>
      </div>

      {/* System Prompts */}
      <h2 style={{ fontSize: '1.8rem', margin: '0 0 0.25rem', color: '#fff' }}>
        🛠 System Prompts
      </h2>
      <p style={{ margin: '0 0 2rem', fontSize: '0.9rem', color: '#888' }}>
        Edit the system prompt for the helper service below — changes take effect immediately.
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
