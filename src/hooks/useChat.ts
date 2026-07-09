import { useState, useRef, useEffect, useCallback } from 'preact/hooks';
import { log, logError, logWarn } from '../lib/logger';
import { sendChat } from '../services/chat';
import { ChatMsg } from '../components/chat/ChatMessages';

interface UseChatOptions {
  mode: string;
  lang: string;
  latitude?: number | null;
  longitude?: number | null;
  initialMessages: ChatMsg[];
  initialConversationId: string | null;
  errorMessage: string;
}

interface UseChatReturn {
  messages: ChatMsg[];
  isLoading: boolean;
  isStreaming: boolean;
  sendMessage: (text: string) => void;
  listRef: { current: HTMLDivElement | null };
}

export function useChat({ mode, lang, latitude, longitude, initialMessages, initialConversationId, errorMessage }: UseChatOptions): UseChatReturn {
  const [messages, setMessages] = useState<ChatMsg[]>(initialMessages);
  const [conversationId, setConversationId] = useState<string | null>(initialConversationId);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  // Refs for values accessed inside the async send callback — avoids stale closures
  const messagesRef = useRef(messages);
  messagesRef.current = messages;
  const conversationIdRef = useRef(conversationId);
  conversationIdRef.current = conversationId;
  const modeRef = useRef(mode);
  modeRef.current = mode;
  const langRef = useRef(lang);
  langRef.current = lang;
  const isLoadingRef = useRef(false);
  const isStreamingRef = useRef(false);

  const errorRef = useRef(errorMessage);
  errorRef.current = errorMessage;

  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      abortRef.current = null;
    };
  }, [mode]);

  // Sync when initial values change (e.g. mode switch reloads fresh conversation)
  useEffect(() => {
    setMessages(initialMessages);
    setConversationId(initialConversationId);
  }, [initialMessages, initialConversationId]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text || isLoadingRef.current || isStreamingRef.current) return;

    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;

    const userMsg: ChatMsg = { role: 'user', text };
    const currentMessages = [...messagesRef.current, userMsg];
    setMessages(currentMessages);

    isLoadingRef.current = true;
    setIsLoading(true);

    const currentMode = modeRef.current;
    const currentLang = langRef.current;
    const currentConvId = conversationIdRef.current;
    const currentErrorMsg = errorRef.current;

    log('chat', `sending message text_len=${text.length} conv=${currentConvId || 'new'} mode=${currentMode}`);
    try {
      const history = currentMessages.slice(0, -1).map((m) => ({
        role: m.role,
        content: m.text,
      }));
      const res = await sendChat({
        mode: currentMode as 'worker_intake' | 'client_intake',
        message: text,
        history,
        conversation_id: currentConvId || undefined,
        lang: currentLang,
        ...(latitude != null && longitude != null ? { latitude, longitude } : {}),
      }, ac.signal);
      if (!res.ok) {
        logError('chat', `chat API returned ${res.status}`);
        setMessages((m) => [...m, { role: 'assistant', text: `Error ${res.status}` }]);
        return;
      }

      let responseText = '';
      setIsLoading(false);
      isLoadingRef.current = false;

      isStreamingRef.current = true;
      setIsStreaming(true);

      if (res.headers.get('content-type')?.includes('text/event-stream')) {
        log('chat', 'streaming SSE response');
        const reader = res.body?.getReader();
        if (!reader) return;
        const decoder = new TextDecoder();
        let buffer = '';
        let streamDone = false;
        while (!streamDone) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const parts = buffer.split('\n');
          buffer = parts.pop() ?? '';
          const lines = parts.filter((l) => l.startsWith('data: '));
          for (const line of lines) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              log('chat', 'SSE stream done');
              streamDone = true;
              break;
            }
            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content || '';
              responseText += content;
              setMessages((m) => {
                const newM = [...m];
                if (newM[newM.length - 1]?.role === 'assistant') {
                  newM[newM.length - 1] = { role: 'assistant', text: responseText };
                } else {
                  newM.push({ role: 'assistant', text: responseText });
                }
                return newM;
              });
            } catch (parseErr) {
              logWarn('chat', `malformed SSE chunk: ${parseErr instanceof Error ? parseErr.message : String(parseErr)}`);
            }
          }
        }
        try { await reader.cancel(); } catch { /* already closed */ }
      } else {
        const data = await res.json();
        log('chat', `received JSON response conv=${data.conversation_id || currentConvId}`);
        responseText = data.answer || data.response || data.text || JSON.stringify(data);
        const workers = data.workers || undefined;
        setMessages((m) => [...m, { role: 'assistant', text: responseText, workers }]);
        if (data.conversation_id) setConversationId(data.conversation_id);
      }
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') {
        log('chat', 'stream aborted (navigation/new send)');
        return;
      }
      logError('chat', `send failed: ${e instanceof Error ? e.message : String(e)}`);
      setMessages((m) => [...m, { role: 'assistant', text: currentErrorMsg }]);
    } finally {
      isLoadingRef.current = false;
      isStreamingRef.current = false;
      setIsLoading(false);
      setIsStreaming(false);
    }
  }, []);

  return { messages, isLoading, isStreaming, sendMessage, listRef };
}
