import { useState, useRef, useEffect, useCallback } from 'preact/hooks';
import { sendChat } from '../services/chat';
import { ChatMsg } from '../components/chat/ChatMessages';

interface UseChatOptions {
  mode: string;
  lang: string;
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

export function useChat({ mode, lang, initialMessages, initialConversationId, errorMessage }: UseChatOptions): UseChatReturn {
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

    const userMsg: ChatMsg = { role: 'user', text };
    const currentMessages = [...messagesRef.current, userMsg];
    setMessages(currentMessages);

    isLoadingRef.current = true;
    setIsLoading(true);

    const currentMode = modeRef.current;
    const currentLang = langRef.current;
    const currentConvId = conversationIdRef.current;
    const currentErrorMsg = errorRef.current;

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
      });
      if (!res.ok) {
        setMessages((m) => [...m, { role: 'assistant', text: `Error ${res.status}` }]);
        return;
      }

      let responseText = '';
      setIsLoading(false);
      isLoadingRef.current = false;

      isStreamingRef.current = true;
      setIsStreaming(true);

      if (res.headers.get('content-type')?.includes('text/event-stream')) {
        const reader = res.body?.getReader();
        if (!reader) return;
        const decoder = new TextDecoder();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n').filter((l) => l.startsWith('data: '));
          for (const line of lines) {
            const data = line.slice(6);
            if (data === '[DONE]') break;
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
            } catch {
              // ignore malformed SSE chunk
            }
          }
        }
      } else {
        const data = await res.json();
        responseText = data.answer || data.response || data.text || JSON.stringify(data);
        const workers = data.workers || undefined;
        setMessages((m) => [...m, { role: 'assistant', text: responseText, workers }]);
        if (data.conversation_id) setConversationId(data.conversation_id);
      }
    } catch {
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
