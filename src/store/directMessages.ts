import { create } from 'zustand';
import { log, logError, logWarn } from '../lib/logger';
import {
  DMConversationItem,
  DMMessage,
  listConversations,
  getMessages,
  sendMessage as apiSend,
  markRead as apiMarkRead,
} from '../lib/directMessageApi';
import { DirectMessageSSE, SSEEvent } from '../lib/sse';

let sse: DirectMessageSSE | null = null;

function getSSE() {
  if (!sse) sse = new DirectMessageSSE();
  return sse;
}

// ── Store ────────────────────────────────────────────────────────────────────

interface DMState {
  conversations: DMConversationItem[];
  messagesByConv: Record<string, DMMessage[]>;
  unreadTotal: number;
  sseStatus: 'disconnected' | 'connecting' | 'open' | 'polling';
  rateLimited: boolean;

  loadInbox: () => Promise<void>;
  loadMessages: (convId: string) => Promise<void>;
  sendMessage: (convId: string, body: string) => Promise<DMMessage>;
  markRead: (convId: string) => void;
  addMessage: (convId: string, msg: DMMessage) => void;
  tallyUnread: (convId: string) => void;
  connect: () => void;
  disconnect: () => void;
  clearRateLimited: () => void;
}

let connected = false;

export const useDirectMessages = create<DMState>((set, get) => ({
  conversations: [],
  messagesByConv: {},
  unreadTotal: 0,
  sseStatus: 'disconnected',
  rateLimited: false,

  loadInbox: async () => {
    log('dm', 'loading inbox');
    try {
      const data = await listConversations({ limit: 50 });
      const total = data.conversations.reduce((sum, c) => sum + (c.unread_count || 0), 0);
      set({ conversations: data.conversations, unreadTotal: total });
      log('dm', `inbox loaded: ${data.conversations.length} conversations, ${total} unread`);
    } catch (e) {
      logError('dm', `loadInbox failed: ${e instanceof Error ? e.message : String(e)}`);
    }
  },

  loadMessages: async (convId: string) => {
    log('dm', `loading messages for conv=${convId}`);
    try {
      const data = await getMessages(convId, { limit: 50 });
      set(s => ({
        messagesByConv: { ...s.messagesByConv, [convId]: data.messages },
      }));
      log('dm', `loaded ${data.messages.length} messages for conv=${convId}`);
    } catch (e) {
      logError('dm', `loadMessages ${convId} failed: ${e instanceof Error ? e.message : String(e)}`);
    }
  },

  sendMessage: async (convId: string, body: string) => {
    log('dm', `sending message conv=${convId} body_len=${body.length}`);
    try {
      const msg = await apiSend(convId, body);
      set(s => ({
        messagesByConv: {
          ...s.messagesByConv,
          [convId]: [...(s.messagesByConv[convId] || []), msg],
        },
        rateLimited: false,
      }));
      log('dm', `message sent conv=${convId} msg_id=${msg.id}`);
      return msg;
    } catch (err: any) {
      if (err?.message?.includes('rate_limited') || err?.message?.includes('429')) {
        logWarn('dm', `rate limited conv=${convId}`);
        set({ rateLimited: true });
        setTimeout(() => get().clearRateLimited(), 5000);
      } else {
        logError('dm', `sendMessage ${convId} failed: ${err?.message || String(err)}`);
      }
      throw err;
    }
  },

  markRead: (convId: string) => {
    log('dm', `marking read conv=${convId}`);
    set(s => {
      const convs = s.conversations.map(c =>
        c.id === convId ? { ...c, unread_count: 0 } : c,
      );
      const total = convs.reduce((sum, c) => sum + (c.unread_count || 0), 0);
      return { conversations: convs, unreadTotal: total };
    });
    apiMarkRead(convId).catch((e) => {
      logError('dm', `markRead ${convId} failed: ${e instanceof Error ? e.message : String(e)}`);
    });
  },

  addMessage: (convId: string, msg: DMMessage) => {
    set(s => {
      const existing = s.messagesByConv[convId] || [];
      if (existing.find(m => m.id === msg.id)) return s;

      // Incrementally update the conversation's last_message and unread count
      // (only if the user is not currently viewing this conversation)
      const updatedConvs = s.conversations.map(c => {
        if (c.id === convId) {
          return {
            ...c,
            last_message: {
              preview: msg.body.slice(0, 100),
              at: msg.created_at,
            },
            unread_count: (c.unread_count || 0) + 1,
          };
        }
        return c;
      });

      const total = updatedConvs.reduce((sum, c) => sum + (c.unread_count || 0), 0);

      return {
        messagesByConv: {
          ...s.messagesByConv,
          [convId]: [...existing, msg],
        },
        conversations: updatedConvs,
        unreadTotal: total,
      };
    });
  },

  tallyUnread: (_convId: string) => {
    // Recalculate unread total from current conversations state
    const total = get().conversations.reduce((sum, c) => sum + (c.unread_count || 0), 0);
    set({ unreadTotal: total });
  },

  clearRateLimited: () => set({ rateLimited: false }),

  connect: () => {
    if (connected) return;
    connected = true;
    log('dm', 'connecting SSE');
    set({ sseStatus: 'connecting' });

    getSSE().connect((event: SSEEvent) => {
      switch (event.type) {
        case 'open':
          set({ sseStatus: 'open' });
          break;

        case 'message': {
          const msg = event.data as DMMessage;
          log('dm', `SSE message received conv=${msg.conversation_id} msg_id=${msg.id}`);
          get().addMessage(msg.conversation_id, msg);
          break;
        }
        case 'read': {
          log('dm', 'SSE read event received');
          get().loadInbox();
          break;
        }
        case 'archive': {
          const payload = event.data as { conversation_id: string };
          log('dm', `SSE archive received conv=${payload.conversation_id}`);
          // Remove conversation from list
          set(s => ({
            conversations: s.conversations.filter(c => c.id !== payload.conversation_id),
          }));
          break;
        }
        case 'block': {
          const payload = event.data as { conversation_id: string };
          log('dm', `SSE block received conv=${payload.conversation_id}`);
          // Update status to blocked
          set(s => ({
            conversations: s.conversations.map(c =>
              c.id === payload.conversation_id ? { ...c, status: 'blocked' } : c
            ),
          }));
          break;
        }
        case 'report': {
          const payload = event.data as { conversation_id: string };
          log('dm', `SSE report received conv=${payload.conversation_id}`);
          // Remove conversation from list (conversation ended)
          set(s => ({
            conversations: s.conversations.filter(c => c.id !== payload.conversation_id),
          }));
          break;
        }
      }
    });
  },

  disconnect: () => {
    connected = false;
    log('dm', 'disconnecting SSE');
    getSSE().disconnect();
    set({ sseStatus: 'disconnected' });
  },


}));
