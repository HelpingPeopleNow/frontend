import { h } from 'preact';
import { useState, useRef, useEffect } from 'preact/hooks';
import { route } from 'preact-router';
import { useAuth } from './AuthProvider';
import { useLanguage, LangToggle } from './i18n';

const API = '/api';

interface ChatMsg {
  role: 'user' | 'assistant';
  text: string;
}

export default function ChatPage() {
  const { session, logout } = useAuth();
  const { t } = useLanguage();
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [detectedRole, setDetectedRole] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [promptsCheck, setPromptsCheck] = useState<'loading' | 'ok' | 'missing'>('loading');
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Check system prompts on mount
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/v1/system-prompts', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          if (data.helper_prompt && data.worker_profile_prompt) {
            setPromptsCheck('ok');
          } else {
            console.warn('[Chat] system prompts missing or empty');
            setPromptsCheck('missing');
          }
        } else {
          console.warn('[Chat] failed to fetch system prompts:', res.status);
          setPromptsCheck('missing');
        }
      } catch (e) {
        console.warn('[Chat] system prompts check failed:', e);
        setPromptsCheck('missing');
      }
    })();
  }, []);

  // Load most recent conversation on mount
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/v1/conversations?type=main&limit=1', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          if (data.conversations && data.conversations.length > 0) {
            const conv = data.conversations[0];
            // Only resume if it's from the last 24 hours
            const updated = new Date(conv.updated_at).getTime();
            if (Date.now() - updated < 24 * 60 * 60 * 1000) {
              const detailRes = await fetch(`/api/v1/conversations/${conv.id}`, { credentials: 'include' });
              if (detailRes.ok) {
                const detail = await detailRes.json();
                if (detail.messages && Array.isArray(detail.messages)) {
                  const loaded = detail.messages.map((m: any) => ({
                    role: m.role as 'user' | 'assistant',
                    text: m.content,
                  }));
                  setMessages(loaded);
                  setConversationId(detail.id);
                  const role = detail.metadata?.detected_role;
                  const sessionRole = session?.user?.role;
                  if ((role === 'worker' || role === 'client') && role === sessionRole) {
                    setDetectedRole(role);
                  }
                  console.log('[Chat] resumed conversation', detail.id, loaded.length, 'messages');
                }
              } else {
                console.warn('[Chat] conversation detail restore failed', detailRes.status);
              }
            }
          }
        } else {
          console.warn('[Chat] conversation list restore failed', res.status);
        }
      } catch (e) {
        console.log('[Chat] could not load previous conversation', e);
      } finally {
        setInitialLoading(false);
      }
    })();
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  // Focus input after sending completes (state has settled)
  useEffect(() => {
    if (!loading && !streaming && !initialLoading) {
      inputRef.current?.focus();
    }
  }, [loading, streaming, initialLoading]);

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
        body: JSON.stringify({
          message: text,
          history,
          conversation_id: conversationId || undefined,
        }),
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
        // Save conversation ID for continued chat
        if (data.conversation_id) {
          setConversationId(data.conversation_id);
          console.log('[Chat] conversation_id:', data.conversation_id);
        }
        // Role detected — show profile button immediately
        if (data.detected_role === 'worker' || data.detected_role === 'client') {
          setDetectedRole(data.detected_role);
        }
      }
      const elapsed = Math.round(performance.now() - startTime);
      console.log('[Chat] response received in', elapsed, 'ms');
    } catch (err) {
      console.error('[Chat] fetch error:', err);
      setMessages(m => [...m, { role: 'assistant', text: t('chat.error.network') }]);
    } finally {
      setLoading(false);
      setStreaming(false);
    }
  };

  const handleLogout = async () => {
    console.log('[Auth] logout');
    await logout();
    route('/login', true);
  };

  if (promptsCheck === 'missing') {
    return (
      <div class="chat-container">
        <div class="prompts-missing">
          <div class="prompts-missing-inner">
            <div class="icon">⚠️</div>
            <h2>System Prompts Missing</h2>
            <p>{t('chat.prompts.missing')}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div class="chat-container">
      <div class="chat-header">
        <h2 class="logo">{t('app.title')}</h2>
        <div class="header-right">
          {session?.user?.role === 'worker' && (
            <button class="btn btn-ghost btn-sm" onClick={() => route('/worker', true)}>{t('nav.worker.profile')}</button>
          )}
          {session?.user?.role === 'client' && (
            <button class="btn btn-ghost btn-sm" onClick={() => route('/client', true)}>{t('nav.client.portal')}</button>
          )}
          <LangToggle />
          <button class="btn btn-primary btn-sm" onClick={() => route('/admin')}>{t('nav.admin')}</button>
          <span class="user-email">{session?.user?.email}</span>
          <button class="btn btn-danger btn-sm" onClick={handleLogout}>{t('auth.logout')}</button>
        </div>
      </div>
      <div class="message-list" ref={listRef}>
        {messages.map((m, i) => (
          <div key={i} class={`msg msg-${m.role}`}>{m.text}</div>
        ))}
        {(loading || streaming) && <div class="msg msg-assistant thinking">{t('chat.thinking')}</div>}
      </div>

      {/* Input area: chat input OR profile button after role detection */}
      <div class="chat-input-area">
        {detectedRole ? (
          <button
            class="btn-profile"
            onClick={() => route(detectedRole === 'worker' ? '/worker' : '/client', true)}
          >
            {detectedRole === 'worker'
              ? t('chat.complete.profile')
              : t('chat.post.request')}
          </button>
        ) : (
          <>
            <input
              class="input"
              value={input}
              onInput={(e: any) => setInput(e.target.value)}
              onKeyDown={(e: any) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), send())}
              placeholder={t('chat.placeholder')}
              disabled={loading || streaming}
              ref={inputRef}
            />
            <button class="btn btn-primary" onClick={send} disabled={loading || streaming || !input.trim()}>Send</button>
          </>
        )}
      </div>
    </div>
  );
}
