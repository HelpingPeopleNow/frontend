import { h } from 'preact';
import { useState, useRef, useEffect, useCallback } from 'preact/hooks';
import { useLanguage } from './i18n';
import AppShell from './AppShell';

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

export default function FindPage() {
  const { t, lang } = useLanguage();
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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
      console.error('[Find] Speech recognition error:', event.error);
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

  // Load most recent search conversation on mount
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/v1/conversations?type=client-find&limit=1', { credentials: 'include' });
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
  }, []);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!loading && !initialLoading) {
      inputRef.current?.focus();
    }
  }, [loading, initialLoading]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
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
      const res = await fetch(`${API}/v1/client/find-chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          mode: 'search',
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
      const data = await res.json();
      const responseText = data.answer || '';
      const workers = data.workers || undefined;
      setMessages(m => [...m, { role: 'assistant', text: responseText, workers }]);
      if (data.conversation_id) {
        setConversationId(data.conversation_id);
      }
    } catch {
      setMessages(m => [...m, { role: 'assistant', text: t('chat.error.network') }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell currentPath="/find" title={t('find.title')}>
      <div class="chat-container">
        <div class="chat-messages" ref={listRef}>
          {messages.length === 0 && !initialLoading ? (
            <div class="chat-welcome">
              <div class="chat-welcome-icon">🔍</div>
              <h3>{t('find.welcome.title')}</h3>
              <p>{t('find.welcome.desc')}</p>
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
          {loading && (
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
              disabled={loading}
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
            placeholder={isRecording ? t('chat.mic.listening') : t('find.placeholder')}
            disabled={loading}
            ref={inputRef}
          />
          <button
            class="chat-send-btn"
            onClick={send}
            disabled={loading || !input.trim()}
          >
            {loading ? '...' : '↑'}
          </button>
        </div>
      </div>
    </AppShell>
  );
}
