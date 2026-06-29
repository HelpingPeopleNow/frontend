import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchPublicProfile, fetchLatestProfiles } from '../../src/lib/publicProfileApi';
import { jsonResponse } from '../helpers/fetch';

describe('lib/publicProfileApi', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    fetchSpy = vi.spyOn(globalThis, 'fetch');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('fetchPublicProfile', () => {
    it('GETs /api/v1/workers/public/{slug} with URL-encoded slug', async () => {
      fetchSpy.mockResolvedValue(jsonResponse({
        body: { id: 'w-1', slug: 'plumb-co', profession: 'Plumber' },
      }));
      await fetchPublicProfile('plumb co');
      const url = fetchSpy.mock.calls[0][0] as string;
      expect(url).toContain('/api/v1/workers/public/plumb%20co');
    });

    it('returns null on 404 instead of throwing', async () => {
      fetchSpy.mockResolvedValue(jsonResponse({ status: 404, ok: false, body: {} }));
      const result = await fetchPublicProfile('nonexistent');
      expect(result).toBeNull();
    });

    it('throws with server error message when present', async () => {
      fetchSpy.mockResolvedValue(jsonResponse({
        status: 500,
        ok: false,
        body: { error: 'database unavailable' },
      }));
      await expect(fetchPublicProfile('foo')).rejects.toThrow('database unavailable');
    });

    it('throws with default message when error body has no message field', async () => {
      fetchSpy.mockResolvedValue(jsonResponse({
        status: 503,
        ok: false,
        body: {},
      }));
      await expect(fetchPublicProfile('foo')).rejects.toThrow('Failed to fetch profile (503)');
    });

    it('returns the parsed JSON on success', async () => {
      const profile = { id: 'w-1', slug: 'plumbco', profession: 'Plumber' };
      fetchSpy.mockResolvedValue(jsonResponse({ body: profile }));
      const result = await fetchPublicProfile('plumbco');
      expect(result).toEqual(profile);
    });
  });

  describe('fetchLatestProfiles', () => {
    it('defaults limit to 6', async () => {
      fetchSpy.mockResolvedValue(jsonResponse({ body: [] }));
      await fetchLatestProfiles();
      const url = fetchSpy.mock.calls[0][0] as string;
      expect(url).toContain('limit=6');
    });

    it('uses the provided limit', async () => {
      fetchSpy.mockResolvedValue(jsonResponse({ body: [] }));
      await fetchLatestProfiles(12);
      const url = fetchSpy.mock.calls[0][0] as string;
      expect(url).toContain('limit=12');
    });

    it('returns an empty array on non-OK responses (graceful degradation)', async () => {
      fetchSpy.mockResolvedValue(jsonResponse({
        status: 500,
        ok: false,
        body: { error: 'boom' },
      }));
      const result = await fetchLatestProfiles();
      expect(result).toEqual([]);
    });

    it('returns parsed profiles on success', async () => {
      const profiles = [{ id: 'w-1', slug: 'foo' }, { id: 'w-2', slug: 'bar' }];
      fetchSpy.mockResolvedValue(jsonResponse({ body: profiles }));
      const result = await fetchLatestProfiles();
      expect(result).toEqual(profiles);
    });
  });
});