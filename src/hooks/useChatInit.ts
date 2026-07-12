import { useState, useEffect, useCallback } from 'preact/hooks';
import { log, logError } from '../lib/logger';
import { listConversations, getConversation, ConversationDTO } from '../services/conversations';
import { WorkerCard as WorkerCardData } from '../services/chat';

export interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
  workers?: WorkerCardData[];
}

interface UseChatInitReturn {
  initialMessages: ChatMessage[];
  initialConversationId: string | null;
  loading: boolean;
  error: boolean;
}

export function useChatInit(convType: string): UseChatInitReturn {
  const [initialMessages, setInitialMessages] = useState<ChatMessage[]>([]);
  const [initialConversationId, setInitialConversationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

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
          workers: m.workers && m.workers.length > 0 ? m.workers : undefined,
        }));

        // For search conversations: if no assistant message has workers,
        // this is a stale pre-migration conversation — skip it so the user
        // gets a fresh search that will show cards.
        if (convType === 'client-find') {
          const hasWorkers = msgs.some(m => m.role === 'assistant' && m.workers && m.workers.length > 0);
          if (!hasWorkers && msgs.length > 0) {
            log('chat', `skipping stale search conversation ${first.id} (no persisted workers)`);
            setInitialMessages([]);
            setInitialConversationId(null);
            return;
          }
        }

        setInitialMessages(msgs);
        setInitialConversationId(detail.id);
      } else {
        log('chat', 'no previous conversation found');
      }
    } catch (e) {
      logError('chat', `load conversation failed: ${e instanceof Error ? e.message : String(e)}`);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [convType]);

  useEffect(() => {
    setLoading(true);
    setError(false);
    setInitialMessages([]);
    setInitialConversationId(null);
    load();
  }, [load]);

  return { initialMessages, initialConversationId, loading, error };
}
