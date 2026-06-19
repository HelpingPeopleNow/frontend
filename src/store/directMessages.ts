import { create } from 'zustand';
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
    try {
      const data = await listConversations({ limit: 50 });
      const total = data.conversations.reduce((sum, c) => sum + (c.unread_count || 0), 0);
      set({ conversations: data.conversations, unreadTotal: total });
    } catch {
      // silent
    }
  },

  loadMessages: async (convId: string) => {
    try {
      const data = await getMessages(convId, { limit: 50 });
      set(s => ({
        messagesByConv: { ...s.messagesByConv, [convId]: data.messages },
      }));
    } catch {
      // silent
    }
  },

  sendMessage: async (convId: string, body: string) => {
    try {
      const msg = await apiSend(convId, body);
      set(s => ({
        messagesByConv: {
          ...s.messagesByConv,
          [convId]: [...(s.messagesByConv[convId] || []), msg],
        },
        rateLimited: false,
      }));
      return msg;
    } catch (err: any) {
      if (err?.message?.includes('rate_limited') || err?.message?.includes('429')) {
        set({ rateLimited: true });
        setTimeout(() => get().clearRateLimited(), 5000);
      }
      throw err;
    }
  },

  markRead: (convId: string) => {
    set(s => {
      const convs = s.conversations.map(c =>
        c.id === convId ? { ...c, unread_count: 0 } : c,
      );
      const total = convs.reduce((sum, c) => sum + (c.unread_count || 0), 0);
      return { conversations: convs, unreadTotal: total };
    });
    apiMarkRead(convId).catch(() => {});
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
    set({ sseStatus: 'connecting' });

    getSSE().connect((event: SSEEvent) => {
      switch (event.type) {
        case 'message': {
          const msg = event.data as DMMessage;
          get().addMessage(msg.conversation_id, msg);

          // Update sseStatus on first successful message delivery
          if (get().sseStatus === 'connecting') {
            set({ sseStatus: 'open' });
          }
          break;
        }
        case 'read': {
          // Reload inbox to update unread counts across conversations
          get().loadInbox();
          break;
        }
      }
    });

    // Transition to polling after a delay if SSE hasn't connected
    setTimeout(() => {
      if (get().sseStatus === 'connecting') {
        set({ sseStatus: 'polling' });
      }
    }, 8000);
  },

  disconnect: () => {
    connected = false;
    getSSE().disconnect();
    set({ sseStatus: 'disconnected' });
  },
}));
