import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  DMConversationItem,
  DMMessage,
} from '../../src/lib/directMessageApi';
import { jsonResponse } from '../helpers/fetch';
import { MockEventSource } from '../helpers/eventsource';
import { makeDMConversationItem, makeDMMessage } from '../fixtures/dm';

async function importFreshStore() {
  vi.resetModules();
  return import('../../src/store/directMessages');
}

describe('store/directMessages', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>;
  let errSpy: ReturnType<typeof vi.spyOn>;
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    MockEventSource.instances = [];
    (globalThis as unknown as { EventSource: typeof MockEventSource }).EventSource = MockEventSource;
    fetchSpy = vi.spyOn(globalThis, 'fetch');
    errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('initial state', () => {
    it('starts empty with disconnected SSE and no rate limit', async () => {
      const { useDirectMessages } = await importFreshStore();
      const s = useDirectMessages.getState();
      expect(s.conversations).toEqual([]);
      expect(s.messagesByConv).toEqual({});
      expect(s.unreadTotal).toBe(0);
      expect(s.sseStatus).toBe('disconnected');
      expect(s.rateLimited).toBe(false);
    });
  });

  describe('loadInbox', () => {
    it('populates conversations and computes unreadTotal', async () => {
      fetchSpy.mockResolvedValue(jsonResponse({
        body: {
          conversations: [
            makeDMConversationItem({ id: 'c-1', unread_count: 3 }),
            makeDMConversationItem({ id: 'c-2', unread_count: 0 }),
          ],
        },
      }));

      const { useDirectMessages } = await importFreshStore();
      await useDirectMessages.getState().loadInbox();
      const s = useDirectMessages.getState();
      expect(s.conversations).toHaveLength(2);
      expect(s.unreadTotal).toBe(3);
    });

    it('silently swallows errors', async () => {
      fetchSpy.mockResolvedValue(jsonResponse({
        status: 500, ok: false, body: { error: 'boom' },
      }));
      const { useDirectMessages } = await importFreshStore();
      await useDirectMessages.getState().loadInbox();
      // No throw; state unchanged
      expect(useDirectMessages.getState().conversations).toEqual([]);
    });
  });

  describe('loadMessages', () => {
    it('stores messages indexed by convId', async () => {
      fetchSpy.mockResolvedValue(jsonResponse({
        body: {
          messages: [makeDMMessage({ id: 'm-1', conversation_id: 'c-1' })],
          has_more: false,
        },
      }));
      const { useDirectMessages } = await importFreshStore();
      await useDirectMessages.getState().loadMessages('c-1');
      expect(useDirectMessages.getState().messagesByConv['c-1']).toHaveLength(1);
    });
  });

  describe('sendMessage', () => {
    it('appends the returned message to the conversation thread', async () => {
      const newMsg = makeDMMessage({ id: 'm-99', conversation_id: 'c-1', body: 'hi' });
      fetchSpy.mockResolvedValue(jsonResponse({ body: newMsg }));
      const { useDirectMessages } = await importFreshStore();
      const result = await useDirectMessages.getState().sendMessage('c-1', 'hi');
      expect(result).toEqual(newMsg);
      expect(useDirectMessages.getState().messagesByConv['c-1']).toEqual([newMsg]);
      expect(useDirectMessages.getState().rateLimited).toBe(false);
    });

    it('sets rateLimited on 429 and clears it after 5s', async () => {
      vi.useFakeTimers();
      fetchSpy.mockResolvedValue(jsonResponse({
        status: 429, ok: false, body: { error: 'rate_limited' },
      }));
      const { useDirectMessages } = await importFreshStore();
      await expect(
        useDirectMessages.getState().sendMessage('c-1', 'hi'),
      ).rejects.toThrow();
      expect(useDirectMessages.getState().rateLimited).toBe(true);
      vi.advanceTimersByTime(5_000);
      expect(useDirectMessages.getState().rateLimited).toBe(false);
    });

    it('sets rateLimited on error message containing "429"', async () => {
      fetchSpy.mockResolvedValue(jsonResponse({
        status: 400, ok: false, body: { error: 'HTTP 429 from upstream' },
      }));
      const { useDirectMessages } = await importFreshStore();
      await expect(
        useDirectMessages.getState().sendMessage('c-1', 'hi'),
      ).rejects.toThrow();
      expect(useDirectMessages.getState().rateLimited).toBe(true);
    });
  });

  describe('markRead', () => {
    it('zeros the unread_count for the conv and recomputes total', async () => {
      fetchSpy.mockResolvedValue(jsonResponse({ status: 204, ok: true }));
      const { useDirectMessages } = await importFreshStore();
      useDirectMessages.setState({
        conversations: [
          makeDMConversationItem({ id: 'c-1', unread_count: 5 }),
          makeDMConversationItem({ id: 'c-2', unread_count: 2 }),
        ],
        unreadTotal: 7,
      });
      useDirectMessages.getState().markRead('c-1');
      const s = useDirectMessages.getState();
      expect(s.conversations.find(c => c.id === 'c-1')!.unread_count).toBe(0);
      expect(s.unreadTotal).toBe(2);
    });

    it('fires the API call but tolerates a failure (does not throw)', async () => {
      fetchSpy.mockResolvedValue(jsonResponse({
        status: 500, ok: false, body: { error: 'boom' },
      }));
      const { useDirectMessages } = await importFreshStore();
      useDirectMessages.setState({
        conversations: [makeDMConversationItem({ id: 'c-1', unread_count: 1 })],
        unreadTotal: 1,
      });
      expect(() => useDirectMessages.getState().markRead('c-1')).not.toThrow();
      // Wait for the promise chain
      await new Promise(r => setTimeout(r, 0));
    });
  });

  describe('addMessage', () => {
    it('deduplicates by message id', async () => {
      const { useDirectMessages } = await importFreshStore();
      const m = makeDMMessage({ id: 'm-1' });
      useDirectMessages.getState().addMessage('c-1', m);
      useDirectMessages.getState().addMessage('c-1', m);
      expect(useDirectMessages.getState().messagesByConv['c-1']).toHaveLength(1);
    });

    it('appends to messagesByConv and bumps unread_count + last_message preview', async () => {
      const { useDirectMessages } = await importFreshStore();
      useDirectMessages.setState({
        conversations: [makeDMConversationItem({ id: 'c-1', unread_count: 0 })],
        messagesByConv: {},
        unreadTotal: 0,
      });
      useDirectMessages.getState().addMessage('c-1', makeDMMessage({
        id: 'm-1', conversation_id: 'c-1', body: 'hello there',
      }));
      const s = useDirectMessages.getState();
      expect(s.messagesByConv['c-1']).toHaveLength(1);
      const c = s.conversations.find(x => x.id === 'c-1')!;
      expect(c.unread_count).toBe(1);
      expect(c.last_message?.preview).toBe('hello there');
      expect(s.unreadTotal).toBe(1);
    });

    it('truncates preview at 100 chars', async () => {
      const { useDirectMessages } = await importFreshStore();
      useDirectMessages.setState({
        conversations: [makeDMConversationItem({ id: 'c-1', unread_count: 0 })],
        messagesByConv: {},
        unreadTotal: 0,
      });
      const longBody = 'x'.repeat(150);
      useDirectMessages.getState().addMessage('c-1', makeDMMessage({
        id: 'm-1', conversation_id: 'c-1', body: longBody,
      }));
      const c = useDirectMessages.getState().conversations.find(x => x.id === 'c-1')!;
      expect(c.last_message?.preview).toHaveLength(100);
    });
  });

  describe('tallyUnread', () => {
    it('recomputes unreadTotal from current conversations', async () => {
      const { useDirectMessages } = await importFreshStore();
      useDirectMessages.setState({
        conversations: [
          makeDMConversationItem({ id: 'c-1', unread_count: 2 }),
          makeDMConversationItem({ id: 'c-2', unread_count: 3 }),
        ],
        unreadTotal: 0,
      });
      useDirectMessages.getState().tallyUnread('c-1');
      expect(useDirectMessages.getState().unreadTotal).toBe(5);
    });
  });

  describe('SSE dispatch via connect()', () => {
    it('updates sseStatus to "open" on heartbeat', async () => {
      const { useDirectMessages } = await importFreshStore();
      useDirectMessages.getState().connect();
      MockEventSource.instances[0].triggerHeartbeat();
      expect(useDirectMessages.getState().sseStatus).toBe('open');
    });

    it('adds inbound messages via the "message" event', async () => {
      const { useDirectMessages } = await importFreshStore();
      useDirectMessages.getState().connect();
      MockEventSource.instances[0].triggerMessage(
        makeDMMessage({ id: 'm-77', conversation_id: 'c-1' }),
      );
      expect(useDirectMessages.getState().messagesByConv['c-1']).toHaveLength(1);
    });

    it('triggers loadInbox on a "read" event', async () => {
      fetchSpy.mockResolvedValue(jsonResponse({
        body: {
          conversations: [makeDMConversationItem({ id: 'c-x', unread_count: 1 })],
        },
      }));
      const { useDirectMessages } = await importFreshStore();
      useDirectMessages.getState().connect();
      MockEventSource.instances[0].triggerNamed('read', {});
      await new Promise(r => setTimeout(r, 0));
      expect(fetchSpy).toHaveBeenCalled();
    });

    it('removes a conversation from the list on "archive" event', async () => {
      const { useDirectMessages } = await importFreshStore();
      useDirectMessages.setState({
        conversations: [
          makeDMConversationItem({ id: 'c-1' }),
          makeDMConversationItem({ id: 'c-2' }),
        ],
      });
      useDirectMessages.getState().connect();
      MockEventSource.instances[0].triggerNamed('archive', { conversation_id: 'c-1' });
      const s = useDirectMessages.getState();
      expect(s.conversations.map(c => c.id)).toEqual(['c-2']);
    });

    it('updates conversation status to "blocked" on "block" event', async () => {
      const { useDirectMessages } = await importFreshStore();
      useDirectMessages.setState({
        conversations: [makeDMConversationItem({ id: 'c-1', status: 'active' })],
      });
      useDirectMessages.getState().connect();
      MockEventSource.instances[0].triggerNamed('block', { conversation_id: 'c-1' });
      expect(useDirectMessages.getState().conversations[0].status).toBe('blocked');
    });

    it('connect() is idempotent — second call is a no-op', async () => {
      const { useDirectMessages } = await importFreshStore();
      useDirectMessages.getState().connect();
      useDirectMessages.getState().connect();
      expect(MockEventSource.instances).toHaveLength(1);
    });
  });
});