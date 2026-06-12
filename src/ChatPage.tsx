import { h } from 'preact';
import { useState, useRef, useEffect, useCallback } from 'preact/hooks';
import { route } from 'preact-router';
import { useAuth } from './AuthProvider';
import { useLanguage } from './i18n';
import AppShell from './AppShell';

const API = '/api';

interface ChatMsg {
  role: 'user' | 'assistant';
  text: string;
}

export default function ChatPage() {
  const { session } = useAuth();
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

  // ── Voice input state ─────────────────────────────────────────────
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [micSupported, setMicSupported] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    if (typeof navigator !== 'undefined' && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      setMicSupported(true);
    }
  }, []);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? 'audio/webm;codecs=opus'
          : 'audio/webm',
      });

      audioChunksRef.current = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => track.stop());

        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        if (audioBlob.size < 100) return; // too small, probably empty

        setIsTranscribing(true);
        try {
          const formData = new FormData();
          formData.append('audio', audioBlob, 'recording.webm');

          const res = await fetch(`${API}/v1/transcribe`, {
            method: 'POST',
            credentials: 'include',
            body: formData,
          });

          if (res.ok) {
            const data = await res.json();
            if (data.text) {
              setInput(prev => prev ? prev + ' ' + data.text : data.text);
            }
          } else {
            console.error('[Chat] Transcription failed:', res.status);
          }
        } catch (err) {
          console.error('[Chat] Transcription error:', err);
        } finally {
          setIsTranscribing(false);
        }
      };

      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);
    } catch (err) {
      console.error('[Chat] Failed to start recording:', err);
      setIsRecording(false);
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current.stream.getTracks().forEach(t => t.stop());
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
          if (data.helper_prompt && data.worker_profile_prompt) {
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

  // Load most recent conversation on mount
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/v1/conversations?type=main&limit=1', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          if (data.conversations && data.conversations.length > 0) {
            const conv = data.conversations[0];
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
                }
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
        if (data.conversation_id) {
          setConversationId(data.conversation_id);
        }
        if (data.detected_role === 'worker' || data.detected_role === 'client') {
          setDetectedRole(data.detected_role);
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
            <h2>System Prompts Missing</h2>
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
              <h3>{t('chat.welcome.title')}</h3>
              <p>{t('chat.welcome.desc1')}</p>
              <p style={{ marginTop: 'var(--sp-2)', color: 'var(--text-muted)' }}>{t('chat.welcome.desc2')}</p>
            </div>
          ) : (
            messages.map((m, i) => (
              <div key={i} class={`chat-bubble ${m.role === 'user' ? 'chat-bubble-user' : 'chat-bubble-assistant'}`}>
                {m.role === 'assistant' && (
                  <div class="chat-role-label">Assistant</div>
                )}
                <div class="chat-content">{m.text}</div>
              </div>
            ))
          )}
          {(loading || streaming) && (
            <div class="chat-bubble chat-bubble-assistant">
              <div class="chat-role-label">Assistant</div>
              <div class="chat-typing">
                <span class="chat-typing-dot" />
                <span class="chat-typing-dot" />
                <span class="chat-typing-dot" />
              </div>
            </div>
          )}
        </div>

        <div class="chat-input-bar">
          {detectedRole ? (
            <button
              class="role-detected-cta"
              onClick={() => route(detectedRole === 'worker' ? '/worker' : '/client', true)}
            >
              <span class="icon">{detectedRole === 'worker' ? '🔧' : '🏠'}</span>
              {detectedRole === 'worker'
                ? t('chat.complete.profile')
                : t('chat.post.request')}
            </button>
          ) : (
            <>
              {micSupported && (
                <button
                  class={`chat-mic-btn ${isRecording ? 'chat-mic-recording' : ''} ${isTranscribing ? 'chat-mic-transcribing' : ''}`}
                  onClick={toggleRecording}
                  disabled={loading || streaming || isTranscribing}
                  title={isTranscribing ? t('chat.mic.transcribing') : isRecording ? t('chat.mic.stop') : t('chat.mic.start')}
                  type="button"
                >
                  {isTranscribing ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="chat-mic-spinner">
                      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                      <line x1="12" y1="19" x2="12" y2="22" />
                    </svg>
                  )}
                </button>
              )}
              <input
                class="input"
                value={input}
                onInput={(e: any) => setInput(e.target.value)}
                onKeyDown={(e: any) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), send())}
                placeholder={isTranscribing ? t('chat.mic.transcribing') : isRecording ? t('chat.mic.listening') : t('chat.placeholder')}
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
            </>
          )}
        </div>
      </div>
    </AppShell>
  );
}
