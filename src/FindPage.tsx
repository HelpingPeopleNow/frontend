import { h } from 'preact';
import { useState, useRef, useEffect } from 'preact/hooks';
import { useLanguage } from './i18n';
import AppShell from './AppShell';
import { sendChat, WorkerCard as WorkerCardData } from './services/chat';
import { useChatInit } from './hooks/useChatInit';
import { useSpeechRecognition } from './hooks/useSpeechRecognition';
import WorkerCard from './components/chat/WorkerCard';

interface ChatMsg {
  role: 'user' | 'assistant';
  text: string;
  workers?: WorkerCardData[];
}

export default function FindPage() {
  const { t, lang } = useLanguage();
  const { initialMessages, initialConversationId, loading: initialLoading } = useChatInit('client-find');
  const [messages, setMessages] = useState<ChatMsg[]>(initialMessages);
  const [conversationId, setConversationId] = useState<string | null>(initialConversationId);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  document.title = `${t('find.title')} | Helping People`;

  const { isSupported: micSupported, isListening, toggle: toggleRecording, transcript } = useSpeechRecognition();

  useEffect(() => {
    setMessages(initialMessages);
    setConversationId(initialConversationId);
  }, [initialMessages, initialConversationId]);

  useEffect(() => {
    if (transcript) setInput((prev) => (prev ? prev + ' ' + transcript : transcript));
  }, [transcript]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!loading && !initialLoading) inputRef.current?.focus();
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
      const res = await sendChat({
        mode: 'search',
        message: text,
        history,
        conversation_id: conversationId || undefined,
        lang,
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
                      <WorkerCard key={w.id} worker={w} />
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
              class={`chat-mic-btn ${isListening ? 'chat-mic-recording' : ''}`}
              onClick={toggleRecording}
              disabled={loading}
              title={isListening ? t('chat.mic.stop') : t('chat.mic.start')}
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
            placeholder={isListening ? t('chat.mic.listening') : t('find.placeholder')}
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
