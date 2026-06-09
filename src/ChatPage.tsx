import { h } from 'preact';
import { useState, useRef, useEffect } from 'preact/hooks';
import { route } from 'preact-router';
import { useAuth } from './AuthProvider';

const API = '/api';

interface ChatMsg {
  role: 'user' | 'assistant';
  text: string;
}

export default function ChatPage() {
  const { session, logout } = useAuth();
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [detectedRole, setDetectedRole] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading || streaming) return;
    setInput('');
    const userMsg: ChatMsg = { role: 'user', text };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setLoading(true);
    const startTime = performance.now();

    console.log('[Chat] send:', text.substring(0, 80));

    try {
      // Build history from all previous messages (excluding the one we're about to send which is already in updatedMessages)
      const history = updatedMessages.slice(0, -1).map(m => ({
        role: m.role,
        content: m.text,
      }));
      const res = await fetch(`${API}/v1/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ message: text, history }),
      });
      if (!res.ok) {
        const errText = await res.text().catch(() => 'Unknown error');
        console.error('[Chat] API error:', res.status, errText.substring(0, 100));
        setMessages(m => [...m, { role: 'assistant', text: `Error ${res.status}` }]);
        return;
      }
      let responseText = '';
      setLoading(false);
      setStreaming(true);

      if (res.headers.get('content-type')?.includes('text/event-stream')) {
        const reader = res.body?.getReader();
        if (!reader) return;
        const decoder = new TextDecoder();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n').filter(l => l.startsWith('data: '));
          for (const line of lines) {
            const data = line.slice(6);
            if (data === '[DONE]') break;
            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content || '';
              responseText += content;
              setMessages(m => {
                const newM = [...m];
                if (newM[newM.length - 1]?.role === 'assistant') {
                  newM[newM.length - 1] = { role: 'assistant', text: responseText };
                } else {
                  newM.push({ role: 'assistant', text: responseText });
                }
                return newM;
              });
            } catch {}
          }
        }
      } else {
        const data = await res.json();
        responseText = data.answer || data.response || data.text || JSON.stringify(data);
        setMessages(m => [...m, { role: 'assistant', text: responseText }]);
        // Role detected — show profile button immediately
        if (data.detected_role === 'worker' || data.detected_role === 'client') {
          setDetectedRole(data.detected_role);
        }
      }
      const elapsed = Math.round(performance.now() - startTime);
      console.log('[Chat] response received in', elapsed, 'ms');
    } catch (err) {
      console.error('[Chat] fetch error:', err);
      setMessages(m => [...m, { role: 'assistant', text: 'Network error — is the backend running?' }]);
    } finally {
      setLoading(false);
      setStreaming(false);
      inputRef.current?.focus();
    }
  };

  const handleLogout = async () => {
    console.log('[Auth] logout');
    await logout();
    route('/login', true);
  };

  return (
    <div class="chat-container">
      <div class="chat-header">
        <h2>HelpingPeopleNow</h2>
        <div class="header-right">
          {session?.user?.role === 'worker' && (
            <button class="btn-nav" onClick={() => route('/worker', true)}>Worker Profile</button>
          )}
          {session?.user?.role === 'client' && (
            <button class="btn-nav" onClick={() => route('/client', true)}>Client Portal</button>
          )}
          <button class="btn-admin" onClick={() => route('/admin')}>Admin</button>
          <span class="user-email">{session?.user?.email}</span>
          <button class="btn-logout" onClick={handleLogout}>Logout</button>
        </div>
      </div>
      <div class="message-list" ref={listRef}>
        {messages.map((m, i) => (
          <div key={i} class={`msg msg-${m.role}`}>{m.text}</div>
        ))}
        {(loading || streaming) && <div class="msg msg-assistant thinking">Thinking...</div>}
      </div>

      {/* Input area: chat input OR profile button after role detection */}
      <div class="input-area">
        {detectedRole ? (
          <button
            class="btn-profile"
            onClick={() => route(detectedRole === 'worker' ? '/worker' : '/client', true)}
          >
            {detectedRole === 'worker'
              ? 'Complete your Worker Profile →'
              : 'Post Your First Request →'}
          </button>
        ) : (
          <>
            <input
              value={input}
              onInput={(e: any) => setInput(e.target.value)}
              onKeyDown={(e: any) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), send())}
              placeholder="Ask anything..."
              disabled={loading || streaming}
              ref={inputRef}
            />
            <button onClick={send} disabled={loading || streaming || !input.trim()}>Send</button>
          </>
        )}
      </div>

      <style>{`
        .chat-container { display: flex; flex-direction: column; height: 100vh; max-width: 800px; margin: 0 auto; }
        .chat-header { display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 1rem; background: #1a1a2e; border-bottom: 1px solid #333; }
        .chat-header h2 { margin: 0; font-size: 1.2rem; color: #e0e0ff; }
        .header-right { display: flex; align-items: center; gap: 0.5rem; }
        .user-email { color: #888; font-size: 0.85rem; }
        .btn-admin, .btn-logout { padding: 0.35rem 0.75rem; border: none; border-radius: 4px; cursor: pointer; font-size: 0.85rem; }
        .btn-admin { background: #4a6cf7; color: white; }
        .btn-logout { background: #444; color: #ccc; }
        .btn-nav { padding: 0.35rem 0.75rem; border: none; border-radius: 4px; cursor: pointer; font-size: 0.85rem; background: #27ae60; color: white; }
        .message-list { flex: 1; overflow-y: auto; padding: 1rem; }
        .msg { padding: 0.75rem 1rem; border-radius: 8px; margin-bottom: 0.5rem; white-space: pre-wrap; }
        .msg-user { background: #4a6cf7; color: white; align-self: flex-end; margin-left: 3rem; }
        .msg-assistant { background: #1a1a2e; color: #e0e0ff; border: 1px solid #333; margin-right: 3rem; }
        .thinking { opacity: 0.6; }
        .input-area { display: flex; padding: 1rem; gap: 0.5rem; border-top: 1px solid #333; }
        .input-area input { flex: 1; padding: 0.75rem; border: 1px solid #333; border-radius: 4px; background: #16213e; color: #e0e0ff; font-size: 1rem; }
        .input-area input:disabled { opacity: 0.5; }
        .input-area button { padding: 0.75rem 1.5rem; border: none; border-radius: 4px; cursor: pointer; font-size: 0.85rem; }
        .input-area button:disabled { opacity: 0.5; }
        .btn-profile { flex: 1; padding: 1rem; background: linear-gradient(135deg, #4a6cf7, #6c63ff); color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 1.1rem; font-weight: 600; letter-spacing: 0.5px; transition: transform 0.15s, box-shadow 0.15s; }
        .btn-profile:hover { transform: translateY(-1px); box-shadow: 0 4px 20px rgba(74, 108, 247, 0.4); }
        .btn-profile:active { transform: translateY(0); }
      `}</style>
    </div>
  );
}
