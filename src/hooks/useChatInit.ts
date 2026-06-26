import { useState, useEffect, useCallback } from 'preact/hooks';
import { log, logError } from '../lib/logger';
import { listConversations, getConversation, ConversationDTO } from '../services/conversations';

export interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
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
        const msgs = (detail.messages || []).map((m) => ({
          role: m.role,
          text: m.content,
        }));
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
