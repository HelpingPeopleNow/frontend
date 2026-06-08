import { h } from 'preact';
import { useState, useRef } from 'preact/hooks';

const API = 'http://51.92.201.150:8081/api';

interface ChatMsg {
  role: 'user' | 'assistant';
  text: string;
}

export default function ChatPage() {
  const [chatMessages, setChatMessages] = useState<ChatMsg[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLTextAreaElement>(null);

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
    } catch (err: unknown) {
      setChatMessages(prev => [...prev, { role: 'assistant', text: `❌ Error: ${err instanceof Error ? err.message : 'unknown'}` }]);
    } finally {
      setChatLoading(false);
      chatInputRef.current?.focus();
    }
  };

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      minHeight: '100vh', fontFamily: 'system-ui, sans-serif', background: '#1a1a2e', color: '#e0e0e0', padding: '2rem 1rem',
    }}>
      <h1 style={{ fontSize: '4rem', margin: '0 0 0.5rem', color: '#00d4ff' }}>hi hermy, p</h1>

      <div style={{ width: '100%', maxWidth: '800px', marginBottom: '3rem' }}>
        <h2 style={{ fontSize: '1.8rem', margin: '0 0 0.25rem', color: '#fff' }}>💬 Chat</h2>
        <p style={{ margin: '0 0 1rem', fontSize: '0.9rem', color: '#888' }}>Ask anything — the assistant will answer.</p>

        <div style={{ height: '400px', overflowY: 'auto', marginBottom: '0.75rem' }}>
          {chatMessages.length === 0 && (
            <p style={{ color: '#555', textAlign: 'center' }}>No messages yet.</p>
          )}
          {chatMessages.map((msg, i) => (
            <div key={i} style={{
              alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '80%', padding: '0.65rem 1rem', borderRadius: '12px',
              background: msg.role === 'user' ? '#0f3460' : '#1a1a2e', border: msg.role === 'user' ? 'none' : '1px solid #0f3460',
              color: '#e0e0e0', fontSize: '0.95rem', whiteSpace: 'pre-wrap',
            }}>
              <small>{msg.role === 'user' ? 'You' : 'Assistant'}</small>
              <div>{msg.text}</div>
            </div>
          ))}
          {chatLoading && <div style={{ color: '#888' }}>Thinking...</div>}
          <div ref={chatEndRef} />
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <textarea ref={chatInputRef} autoFocus value={chatInput}
            onInput={(e) => setChatInput((e.target as HTMLTextAreaElement).value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }}}
            placeholder="Ask something..." rows={2} disabled={chatLoading}
            style={{ flex: 1, padding: '0.75rem', fontSize: '0.95rem', background: '#1a1a2e', color: '#e0e0e0', border: '1px solid #0f3460', borderRadius: '8px', resize: 'none' }} />
          <button onClick={handleSend} disabled={chatLoading || !chatInput.trim()}
            style={{ padding: '0.75rem 1.5rem', fontSize: '1rem', border: 'none', borderRadius: '8px', background: chatLoading || !chatInput.trim() ? '#555' : '#00d4ff', color: '#1a1a2e', cursor: 'pointer', fontWeight: 600 }}>
            {chatLoading ? '...' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  );
}