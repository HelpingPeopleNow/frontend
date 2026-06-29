import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { listConversations, getConversation } from '../../src/services/conversations';
import { jsonResponse } from '../helpers/fetch';

describe('services/conversations', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    fetchSpy = vi.spyOn(globalThis, 'fetch');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('listConversations', () => {
    it('defaults limit=20 and offset=0 and omits type when not provided', async () => {
      fetchSpy.mockResolvedValue(jsonResponse({ body: { conversations: [], total: 0, limit: 20, offset: 0 } }));
      await listConversations();
      const url = fetchSpy.mock.calls[0][0] as string;
      expect(url).toContain('/api/v1/conversations');
      expect(url).toContain('limit=20');
      expect(url).toContain('offset=0');
      expect(url).not.toContain('type=');
    });

    it('includes the type parameter when provided', async () => {
      fetchSpy.mockResolvedValue(jsonResponse({ body: { conversations: [], total: 0, limit: 5, offset: 10 } }));
      await listConversations('worker', 5, 10);
      const url = fetchSpy.mock.calls[0][0] as string;
      expect(url).toContain('type=worker');
      expect(url).toContain('limit=5');
      expect(url).toContain('offset=10');
    });
  });

  describe('getConversation', () => {
    it('GETs /api/v1/conversations/{id}', async () => {
      fetchSpy.mockResolvedValue(jsonResponse({
        body: { id: 'conv-1', user_id: 'u-1', type: 'worker', messages: [], created_at: '', updated_at: '' },
      }));
      await getConversation('conv-1');
      const url = fetchSpy.mock.calls[0][0] as string;
      expect(url).toBe('/api/v1/conversations/conv-1');
    });
  });
});