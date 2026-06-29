import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  getContact,
  listConversations,
  getMessages,
  sendMessage,
  markRead,
  archiveConversation,
  blockConversation,
  reportConversation,
  pollSince,
} from '../../src/lib/directMessageApi';
import { jsonResponse } from '../helpers/fetch';

describe('lib/directMessageApi', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    fetchSpy = vi.spyOn(globalThis, 'fetch');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('fetchJSON shared behavior', () => {
    it('prefixes paths with /api/v1 and uses credentials: include', async () => {
      fetchSpy.mockResolvedValue(jsonResponse({ body: { ok: true } }));
      await listConversations();
      const url = fetchSpy.mock.calls[0][0] as string;
      const init = fetchSpy.mock.calls[0][1] as RequestInit;
      expect(url).toMatch(/^\/api\/v1\//);
      expect(init.credentials).toBe('include');
      expect(init.headers).toMatchObject({ 'Content-Type': 'application/json' });
    });

    it('returns undefined on 204 (markRead)', async () => {
      fetchSpy.mockResolvedValue(jsonResponse({ status: 204, ok: true }));
      const result = await markRead('conv-1');
      expect(result).toBeUndefined();
    });

    it('throws with the server error message when present', async () => {
      fetchSpy.mockResolvedValue(jsonResponse({
        status: 500,
        ok: false,
        body: { error: 'database is down' },
      }));
      await expect(listConversations()).rejects.toThrow('database is down');
    });

    it('falls back to "Request failed (status)" when error body has no message', async () => {
      fetchSpy.mockResolvedValue(jsonResponse({
        status: 503,
        ok: false,
        body: {},
      }));
      await expect(listConversations()).rejects.toThrow('Request failed (503)');
    });

    it('falls back gracefully when error body is not JSON', async () => {
      fetchSpy.mockResolvedValue(jsonResponse({
        status: 502,
        ok: false,
        parseError: true,
      }));
      await expect(listConversations()).rejects.toThrow('Request failed (502)');
    });
  });

  describe('getContact', () => {
    it('GETs /api/v1/workers/{id}/contact', async () => {
      fetchSpy.mockResolvedValue(jsonResponse({
        body: { conversation_id: 'conv-1', worker: {}, created: true },
      }));
      const result = await getContact('wp-1');
      expect(fetchSpy).toHaveBeenCalledWith('/api/v1/workers/wp-1/contact', expect.any(Object));
      expect(result.conversation_id).toBe('conv-1');
    });
  });

  describe('listConversations', () => {
    it('builds the URL without a query string by default', async () => {
      fetchSpy.mockResolvedValue(jsonResponse({ body: { conversations: [] } }));
      await listConversations();
      expect(fetchSpy).toHaveBeenCalledWith('/api/v1/direct-messages', expect.any(Object));
    });

    it('includes status and limit in the query string when provided', async () => {
      fetchSpy.mockResolvedValue(jsonResponse({ body: { conversations: [] } }));
      await listConversations({ status: 'archived', limit: 5 });
      const url = fetchSpy.mock.calls[0][0] as string;
      expect(url).toContain('status=archived');
      expect(url).toContain('limit=5');
    });

    it('omits empty params from the query string', async () => {
      fetchSpy.mockResolvedValue(jsonResponse({ body: { conversations: [] } }));
      await listConversations({ limit: 0 });
      const url = fetchSpy.mock.calls[0][0] as string;
      expect(url).not.toContain('limit=');
    });
  });

  describe('getMessages', () => {
    it('GETs /api/v1/direct-messages/{convId}/messages', async () => {
      fetchSpy.mockResolvedValue(jsonResponse({ body: { messages: [], has_more: false } }));
      await getMessages('conv-1');
      const url = fetchSpy.mock.calls[0][0] as string;
      expect(url).toContain('/direct-messages/conv-1/messages');
    });

    it('includes limit and before cursor in the query string', async () => {
      fetchSpy.mockResolvedValue(jsonResponse({ body: { messages: [], has_more: true } }));
      await getMessages('conv-1', { limit: 25, before: 'msg-99' });
      const url = fetchSpy.mock.calls[0][0] as string;
      expect(url).toContain('limit=25');
      expect(url).toContain('before=msg-99');
    });
  });

  describe('sendMessage', () => {
    it('POSTs JSON body and returns the new message', async () => {
      const newMsg = { id: 'msg-2', conversation_id: 'conv-1', body: 'hi' };
      fetchSpy.mockResolvedValue(jsonResponse({ body: newMsg }));
      const result = await sendMessage('conv-1', 'hi');
      const init = fetchSpy.mock.calls[0][1] as RequestInit;
      expect(init.method).toBe('POST');
      expect(JSON.parse(init.body as string)).toEqual({ body: 'hi' });
      expect(result).toEqual(newMsg);
    });
  });

  describe('markRead', () => {
    it('sends PATCH /api/v1/direct-messages/{convId}/read', async () => {
      fetchSpy.mockResolvedValue(jsonResponse({ status: 204, ok: true }));
      await markRead('conv-1');
      const init = fetchSpy.mock.calls[0][1] as RequestInit;
      expect(init.method).toBe('PATCH');
    });
  });

  describe('archiveConversation', () => {
    it('sends POST to /archive', async () => {
      fetchSpy.mockResolvedValue(jsonResponse({ status: 204, ok: true }));
      await archiveConversation('conv-1');
      const url = fetchSpy.mock.calls[0][0] as string;
      const init = fetchSpy.mock.calls[0][1] as RequestInit;
      expect(url).toContain('/direct-messages/conv-1/archive');
      expect(init.method).toBe('POST');
    });
  });

  describe('blockConversation', () => {
    it('sends POST to /block', async () => {
      fetchSpy.mockResolvedValue(jsonResponse({ status: 204, ok: true }));
      await blockConversation('conv-1');
      const url = fetchSpy.mock.calls[0][0] as string;
      const init = fetchSpy.mock.calls[0][1] as RequestInit;
      expect(url).toContain('/direct-messages/conv-1/block');
      expect(init.method).toBe('POST');
    });
  });

  describe('reportConversation', () => {
    it('sends POST with { reason } body', async () => {
      fetchSpy.mockResolvedValue(jsonResponse({ status: 204, ok: true }));
      await reportConversation('conv-1', 'spam');
      const init = fetchSpy.mock.calls[0][1] as RequestInit;
      expect(init.method).toBe('POST');
      expect(JSON.parse(init.body as string)).toEqual({ reason: 'spam' });
    });

    it('uses empty-string reason when omitted', async () => {
      fetchSpy.mockResolvedValue(jsonResponse({ status: 204, ok: true }));
      await reportConversation('conv-1');
      const init = fetchSpy.mock.calls[0][1] as RequestInit;
      expect(JSON.parse(init.body as string)).toEqual({ reason: '' });
    });
  });

  describe('pollSince', () => {
    it('GETs /direct-messages/since with URL-encoded timestamp', async () => {
      fetchSpy.mockResolvedValue(jsonResponse({ body: { messages: [], server_time: 'now' } }));
      const ts = '2026-01-01T00:00:00Z';
      await pollSince(ts);
      const url = fetchSpy.mock.calls[0][0] as string;
      expect(url).toContain('/direct-messages/since');
      expect(url).toContain(`ts=${encodeURIComponent(ts)}`);
    });
  });
});