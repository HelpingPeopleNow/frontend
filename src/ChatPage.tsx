import { h } from 'preact';
import { useState, useRef, useEffect, useCallback } from 'preact/hooks';
import { useAuth } from './AuthProvider';
import { useLanguage } from './i18n';
import AppShell from './AppShell';
import ModeChooser from './ModeChooser';

const API = '/api';

interface ChatMsg {
  role: 'user' | 'assistant';
  text: string;
  workers?: WorkerCard[];
}

interface WorkerCard {
  id: number;
  profession: string;
  business_name: string;
  bio: string;
  city: string;
  hourly_rate: number;
  free_estimate: boolean;
  years_experience: number;
  certifications: string[];
  has_insurance: boolean;
  emergency_service: boolean;
}

export default function ChatPage() {
  const { session } = useAuth();
  const { t, lang } = useLanguage();
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [promptsCheck, setPromptsCheck] = useState<'loading' | 'ok' | 'missing'>('loading');
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Determine mode from URL query params
  const params = new URLSearchParams(window.location.search);
  const modeParam = params.get('mode') as 'worker_intake' | 'client_intake' | null;

  // If no mode selected, show the chooser
  if (!modeParam) {
    return (
      <AppShell currentPath="/" title={t('app.title')}>
        <ModeChooser />
      </AppShell>
    );
  }

  const mode = modeParam;
  const convType = mode === 'worker_intake' ? 'worker' : 'client';

  // ── Voice input state ─────────────────────────────────────────────
  const [isRecording, setIsRecording] = useState(false);
  const [micSupported, setMicSupported] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SR) setMicSupported(true);
  }, []);

  const startRecording = useCallback(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;

    const recognition = new SR();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = navigator.language || 'en-US';

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      if (transcript) {
        setInput(prev => prev ? prev + ' ' + transcript : transcript);
      }
    };

    recognition.onerror = (event: any) => {
      console.error('[Chat] Speech recognition error:', event.error);
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognition.start();
    recognitionRef.current = recognition;
    setIsRecording(true);
  }, []);

  const stopRecording = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }
  }, []);

  const toggleRecording = useCallback(() => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [isRecording, startRecording, stopRecording]);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  // Check system prompts on mount
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/v1/system-prompts', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          if (data.worker_profile_prompt && data.client_profile_prompt) {
            setPromptsCheck('ok');
          } else {
            setPromptsCheck('missing');
          }
        } else {
          setPromptsCheck('missing');
        }
      } catch {
        setPromptsCheck('missing');
      }
    })();
  }, []);

  // Load most recent conversation when mode changes
  const prevConvTypeRef = useRef(convType);
  useEffect(() => {
    // Reset state when switching modes
    if (prevConvTypeRef.current !== convType) {
      setMessages([]);
      setConversationId(null);
      prevConvTypeRef.current = convType;
    }
    setInitialLoading(true);
    (async () => {
      try {
        const res = await fetch(`/api/v1/conversations?type=${convType}&limit=1`, { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          if (data.conversations && data.conversations.length > 0) {
            const conv = data.conversations[0];
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
              }
            }
          }
        }
      } catch {
        // No previous conversation
      } finally {
        setInitialLoading(false);
      }
    })();
  }, [convType]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

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

    try {
      const history = updatedMessages.slice(0, -1).map(m => ({
        role: m.role,
        content: m.text,
      }));
      // Route to the correct backend endpoint based on mode
      let endpoint: string;
      if (mode === 'worker_intake') endpoint = `${API}/v1/worker/chat`;
      else if (mode === 'client_intake') endpoint = `${API}/v1/client/chat`;
      else endpoint = `${API}/v1/client/find-chat`;

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          mode,
          message: text,
          history,
          conversation_id: conversationId || undefined,
          lang,
        }),
      });
      if (!res.ok) {
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
        const workers = data.workers || undefined;
        setMessages(m => [...m, { role: 'assistant', text: responseText, workers }]);
        if (data.conversation_id) {
          setConversationId(data.conversation_id);
        }
      }
    } catch {
      setMessages(m => [...m, { role: 'assistant', text: t('chat.error.network') }]);
    } finally {
      setLoading(false);
      setStreaming(false);
    }
  };

  if (promptsCheck === 'missing') {
    return (
      <AppShell currentPath="/" title={t('app.title')}>
        <div class="prompts-missing">
          <div class="prompts-missing-card">
            <div class="prompts-missing-icon">⚠️</div>
            <h2>{t('chat.prompts.title')}</h2>
            <p>{t('chat.prompts.missing')}</p>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell currentPath="/" title={t('app.title')}>
      <div class="chat-container">
        <div class="chat-messages" ref={listRef}>
          {messages.length === 0 && !initialLoading ? (
            <div class="chat-welcome">
              <div class="chat-welcome-icon">💬</div>
              <h3>{mode === 'worker_intake' ? t('chat.welcome.worker.title') : t('chat.welcome.client.title')}</h3>
              <p>{mode === 'worker_intake' ? t('chat.welcome.worker.desc') : t('chat.welcome.client.desc')}</p>
            </div>
          ) : (
            messages.map((m, i) => (
              <div key={i} class={`chat-bubble ${m.role === 'user' ? 'chat-bubble-user' : 'chat-bubble-assistant'}`}>
                {m.role === 'assistant' && (
                  <div class="chat-role-label">{t('chat.role.assistant')}</div>
                )}
                <div class="chat-content">{m.text}</div>
                {m.workers && m.workers.length > 0 && (
                  <div class="worker-card-grid" style={{ marginTop: 'var(--sp-3)' }}>
                    {m.workers.map(w => (
                      <div key={w.id} class="worker-card">
                        <div class="worker-card-header">
                          <span class="worker-card-name">{w.business_name || w.profession}</span>
                          <span class="worker-card-rate">€{w.hourly_rate}/hr</span>
                        </div>
                        <div class="worker-card-meta">
                          {w.profession} · {w.city} · {w.years_experience} {t('worker.card.years_exp')}
                        </div>
                        {w.bio && <div class="worker-card-bio">{w.bio}</div>}
                        <div class="worker-card-badges">
                          {w.has_insurance && <span class="worker-badge worker-badge-insured">✓ {t('client.find.badge.insured')}</span>}
                          {w.emergency_service && <span class="worker-badge worker-badge-emergency">⚡ {t('client.find.badge.emergency')}</span>}
                          {w.free_estimate && <span class="worker-badge worker-badge-estimate">📋 {t('client.find.badge.free_estimate')}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {m.workers && m.workers.length === 0 && (
                  <div class="worker-card-empty">{t('client.find.no_results')}</div>
                )}
              </div>
            ))
          )}
          {(loading || streaming) && (
            <div class="chat-bubble chat-bubble-assistant">
              <div class="chat-role-label">{t('chat.role.assistant')}</div>
              <div class="chat-typing">
                <span class="chat-typing-dot" />
                <span class="chat-typing-dot" />
                <span class="chat-typing-dot" />
              </div>
            </div>
          )}
        </div>

        <div class="chat-input-bar">
          {micSupported && (
            <button
              class={`chat-mic-btn ${isRecording ? 'chat-mic-recording' : ''}`}
              onClick={toggleRecording}
              disabled={loading || streaming}
              title={isRecording ? t('chat.mic.stop') : t('chat.mic.start')}
              type="button"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" y1="19" x2="12" y2="22" />
              </svg>
            </button>
          )}
          <input
            class="input"
            value={input}
            onInput={(e: any) => setInput(e.target.value)}
            onKeyDown={(e: any) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), send())}
            placeholder={isRecording ? t('chat.mic.listening') : t('chat.placeholder')}
            disabled={loading || streaming}
            ref={inputRef}
          />
          <button
            class="chat-send-btn"
            onClick={send}
            disabled={loading || streaming || !input.trim()}
          >
            {loading || streaming ? '...' : '↑'}
          </button>
        </div>
      </div>
    </AppShell>
  );
}
