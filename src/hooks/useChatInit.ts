import { useState, useEffect, useCallback } from 'preact/hooks';
import { log, logError } from '../lib/logger';
import { listConversations, getConversation, ConversationDTO } from '../services/conversations';
import { sendChat, WorkerCard as WorkerCardData } from '../services/chat';

export interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
  workers?: WorkerCardData[];
}

interface UseChatInitReturn {
  initialMessages: ChatMessage[];
  initialConversationId: string | null;
  loading: boolean;
}

export function useChatInit(convType: string): UseChatInitReturn {
  const [initialMessages, setInitialMessages] = useState<ChatMessage[]>([]);
  const [initialConversationId, setInitialConversationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    log('chat', `loading previous conversation type=${convType}`);
    try {
      const data = await listConversations(convType, 1, 0);
      const first = data.conversations?.[0];
      if (first) {
        log('chat', `found existing conversation ${first.id}`);
        const detail: ConversationDTO = await getConversation(first.id);
        const msgs: ChatMessage[] = (detail.messages || []).map((m) => ({
          role: m.role,
          text: m.content,
        }));

        // For search conversations, re-fetch worker cards from the last assistant message
        if (convType === 'client-find' && msgs.length > 0) {
          const lastAssistantIdx = msgs.map((m, i) => m.role === 'assistant' ? i : -1).filter(i => i >= 0).pop();
          if (lastAssistantIdx !== undefined && !msgs[lastAssistantIdx].workers) {
            // Find the last user message to re-search
            const lastUserMsg = [...msgs].reverse().find(m => m.role === 'user');
            if (lastUserMsg) {
              log('chat', `re-fetching workers for old search: "${lastUserMsg.text}"`);
              try {
                const res = await sendChat({
                  mode: 'search',
                  message: lastUserMsg.text,
                  history: msgs.slice(0, -1).map(m => ({ role: m.role, content: m.text })),
                  conversation_id: detail.id,
                  lang: navigator.language.startsWith('es') ? 'es' : 'en',
                });
                if (res.ok) {
                  const fresh = await res.json();
                  if (fresh.workers && fresh.workers.length > 0) {
                    msgs[lastAssistantIdx].workers = fresh.workers;
                    log('chat', `re-fetched ${fresh.workers.length} workers for old conversation`);
                  }
                }
              } catch (e) {
                logError('chat', `worker re-fetch failed: ${e instanceof Error ? e.message : String(e)}`);
              }
            }
          }
        }

        setInitialMessages(msgs);
        setInitialConversationId(detail.id);
      } else {
        log('chat', 'no previous conversation found');
      }
    } catch (e) {
      logError('chat', `load conversation failed: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setLoading(false);
    }
  }, [convType]);

  useEffect(() => {
    setLoading(true);
    setInitialMessages([]);
    setInitialConversationId(null);
    load();
  }, [load]);

  return { initialMessages, initialConversationId, loading };
}
