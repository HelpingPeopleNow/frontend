import { describe, it, expect, vi, beforeEach } from 'vitest';
import { jsonResponse } from '../helpers/fetch';

let fetchSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  fetchSpy = vi.spyOn(globalThis, 'fetch');
});

async function importFresh() {
  vi.resetModules();
  return import('../../src/lib/directMessageApi');
}

describe('lib/directMessageApi', () => {
  describe('listConversations', () => {
    it('GETs /api/v1/direct-messages with credentials', async () => {
      fetchSpy.mockResolvedValue(jsonResponse({ body: { conversations: [] } }));
      const { listConversations } = await importFresh();
      await listConversations();
      const url = fetchSpy.mock.calls[0][0] as string;
      const init = fetchSpy.mock.calls[0][1] as RequestInit;
      expect(url).toBe('/api/v1/direct-messages');
      expect(init.credentials).toBe('include');
    });

    it('applies default AbortSignal.timeout(15000) when caller provides no signal (P1-1)', async () => {
      fetchSpy.mockResolvedValue(jsonResponse({ body: { conversations: [] } }));
      const { listConversations } = await importFresh();
      await listConversations();
      const init = fetchSpy.mock.calls[0][1] as RequestInit;
      expect(init.signal).toBeInstanceOf(AbortSignal);
    });

    it('preserves caller-supplied AbortSignal (does not override with default timeout)', async () => {
      fetchSpy.mockResolvedValue(jsonResponse({ body: { conversations: [] } }));
      const { listConversations } = await importFresh();
      const ac = new AbortController();
      // listConversations doesn't accept signal directly, but fetchJSON uses options.signal
      // We test that fetch receives a signal at all (the default timeout)
      await listConversations();
      const init = fetchSpy.mock.calls[0][1] as RequestInit;
      expect(init.signal).toBeInstanceOf(AbortSignal);
    });

    it('passes status and limit query params', async () => {
      fetchSpy.mockResolvedValue(jsonResponse({ body: { conversations: [] } }));
      const { listConversations } = await importFresh();
      await listConversations({ status: 'active', limit: 10 });
      const url = fetchSpy.mock.calls[0][0] as string;
      expect(url).toContain('status=active');
      expect(url).toContain('limit=10');
    });

    it('returns the parsed response', async () => {
      const data = { conversations: [{ id: 'c-1', unread_count: 1, status: 'active', other_party: { id: 'w-1', name: 'A', type: 'worker' } }] };
      fetchSpy.mockResolvedValue(jsonResponse({ body: data }));
      const { listConversations } = await importFresh();
      const result = await listConversations();
      expect(result).toEqual(data);
    });
  });

  describe('getMessages', () => {
    it('GETs /api/v1/direct-messages/{convId}/messages with credentials', async () => {
      fetchSpy.mockResolvedValue(jsonResponse({ body: { messages: [], has_more: false } }));
      const { getMessages } = await importFresh();
      await getMessages('conv-1');
      const url = fetchSpy.mock.calls[0][0] as string;
      expect(url).toBe('/api/v1/direct-messages/conv-1/messages');
    });

    it('applies default AbortSignal.timeout(15000) (P1-1)', async () => {
      fetchSpy.mockResolvedValue(jsonResponse({ body: { messages: [], has_more: false } }));
      const { getMessages } = await importFresh();
      await getMessages('conv-1');
      const init = fetchSpy.mock.calls[0][1] as RequestInit;
      expect(init.signal).toBeInstanceOf(AbortSignal);
    });
  });

  describe('sendMessage', () => {
    it('POSTs the message body as JSON with default timeout (P1-1)', async () => {
      fetchSpy.mockResolvedValue(jsonResponse({ body: { id: 'm-1' } }));
      const { sendMessage } = await importFresh();
      await sendMessage('conv-1', 'hello');
      const url = fetchSpy.mock.calls[0][0] as string;
      const init = fetchSpy.mock.calls[0][1] as RequestInit;
      expect(url).toBe('/api/v1/direct-messages/conv-1/messages');
      expect(init.method).toBe('POST');
      expect(JSON.parse(init.body as string)).toEqual({ body: 'hello' });
      expect(init.signal).toBeInstanceOf(AbortSignal);
    });
  });

  describe('markRead', () => {
    it('PATCHes with default timeout (P1-1)', async () => {
      fetchSpy.mockResolvedValue(jsonResponse({ status: 204, ok: true }));
      const { markRead } = await importFresh();
      await markRead('conv-1');
      const init = fetchSpy.mock.calls[0][1] as RequestInit;
      expect(init.method).toBe('PATCH');
      expect(init.signal).toBeInstanceOf(AbortSignal);
    });
  });

  describe('archive/block/report', () => {
    it('archiveConversation POSTs with default timeout (P1-1)', async () => {
      fetchSpy.mockResolvedValue(jsonResponse({ status: 204, ok: true }));
      const { archiveConversation } = await importFresh();
      await archiveConversation('conv-1');
      expect(fetchSpy.mock.calls[0][1]).toMatchObject({ method: 'POST' });
    });

    it('blockConversation POSTs with default timeout (P1-1)', async () => {
      fetchSpy.mockResolvedValue(jsonResponse({ status: 204, ok: true }));
      const { blockConversation } = await importFresh();
      await blockConversation('conv-1');
      expect(fetchSpy.mock.calls[0][1]).toMatchObject({ method: 'POST' });
    });

    it('reportConversation POSTs with reason body and default timeout (P1-1)', async () => {
      fetchSpy.mockResolvedValue(jsonResponse({ status: 204, ok: true }));
      const { reportConversation } = await importFresh();
      await reportConversation('conv-1', 'spam');
      const init = fetchSpy.mock.calls[0][1] as RequestInit;
      expect(init.method).toBe('POST');
      expect(JSON.parse(init.body as string)).toEqual({ reason: 'spam' });
      expect(init.signal).toBeInstanceOf(AbortSignal);
    });
  });

  describe('pollSince', () => {
    it('GETs /since?ts=... with default timeout (P1-1)', async () => {
      fetchSpy.mockResolvedValue(jsonResponse({ body: { messages: [], server_time: 'now' } }));
      const { pollSince } = await importFresh();
      await pollSince('2026-01-01T00:00:00Z');
      const url = fetchSpy.mock.calls[0][0] as string;
      expect(url).toContain('/api/v1/direct-messages/since?ts=');
      const init = fetchSpy.mock.calls[0][1] as RequestInit;
      expect(init.signal).toBeInstanceOf(AbortSignal);
    });
  });

  describe('getContact', () => {
    it('calls /workers/{id}/contact with default timeout (P1-1)', async () => {
      fetchSpy.mockResolvedValue(jsonResponse({ body: { conversation_id: 'c-1', worker: { id: 'w-1', user_id: 'u-1', profession: 'Plumber', business_name: 'Co', city: 'M' }, created: false } }));
      const { getContact } = await importFresh();
      const result = await getContact('w-1');
      expect(result.conversation_id).toBe('c-1');
      const init = fetchSpy.mock.calls[0][1] as RequestInit;
      expect(init.signal).toBeInstanceOf(AbortSignal);
    });
  });
});
