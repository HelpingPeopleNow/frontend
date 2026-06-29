import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getSession, sendMagicLink, logout } from '../../src/services/auth';
import { jsonResponse } from '../helpers/fetch';

describe('services/auth', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>;
  let errSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    fetchSpy = vi.spyOn(globalThis, 'fetch');
    errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getSession', () => {
    it('returns null when session and user are missing', async () => {
      fetchSpy.mockResolvedValue(jsonResponse({ body: { session: null, user: null } }));
      expect(await getSession()).toBeNull();
    });

    it('returns null when response has neither session nor user', async () => {
      fetchSpy.mockResolvedValue(jsonResponse({ body: {} }));
      expect(await getSession()).toBeNull();
    });

    it('returns null on fetch error (does not throw)', async () => {
      fetchSpy.mockRejectedValue(new Error('network down'));
      expect(await getSession()).toBeNull();
    });

    it('returns null on non-OK response (request throws ApiError)', async () => {
      fetchSpy.mockResolvedValue(jsonResponse({
        status: 401,
        ok: false,
        body: { error: 'unauthorized' },
      }));
      expect(await getSession()).toBeNull();
    });

    it('returns a Session when both user and session are present', async () => {
      fetchSpy.mockResolvedValue(jsonResponse({
        body: {
          session: { token: 'tok-1' },
          user: { id: 'u-1', email: 'a@b.com', name: 'Alice' },
        },
      }));
      const result = await getSession();
      expect(result).toEqual({
        user: { id: 'u-1', email: 'a@b.com', name: 'Alice' },
        token: 'tok-1',
      });
    });

    it('tolerates a missing user.name', async () => {
      fetchSpy.mockResolvedValue(jsonResponse({
        body: {
          session: { token: 'tok-1' },
          user: { id: 'u-1', email: 'a@b.com' },
        },
      }));
      const result = await getSession();
      expect(result?.user.name).toBeUndefined();
    });
  });

  describe('sendMagicLink', () => {
    it('POSTs to /api/auth/sign-in/magic-link with email, callbackURL, and metadata.lang', async () => {
      fetchSpy.mockResolvedValue(jsonResponse({ body: { ok: true } }));
      await sendMagicLink('a@b.com', 'en');
      const init = fetchSpy.mock.calls[0][1] as RequestInit;
      expect(init.method).toBe('POST');
      expect(JSON.parse(init.body as string)).toEqual({
        email: 'a@b.com',
        callbackURL: '/',
        metadata: { lang: 'en' },
      });
    });

    it('defaults lang to "es" when not provided', async () => {
      fetchSpy.mockResolvedValue(jsonResponse({ body: { ok: true } }));
      await sendMagicLink('a@b.com');
      const init = fetchSpy.mock.calls[0][1] as RequestInit;
      expect(JSON.parse(init.body as string).metadata.lang).toBe('es');
    });

    it('returns { ok: true } on success', async () => {
      fetchSpy.mockResolvedValue(jsonResponse({ body: { ok: true } }));
      expect(await sendMagicLink('a@b.com')).toEqual({ ok: true });
    });

    it('returns { ok: false, error } on failure', async () => {
      fetchSpy.mockResolvedValue(jsonResponse({
        status: 500,
        ok: false,
        body: { error: 'rate limit' },
      }));
      const result = await sendMagicLink('a@b.com');
      expect(result.ok).toBe(false);
      expect(result.error).toBe('rate limit');
    });
  });

  describe('logout', () => {
    it('POSTs to /api/auth/sign-out', async () => {
      fetchSpy.mockResolvedValue(jsonResponse({ body: { ok: true } }));
      await logout();
      const url = fetchSpy.mock.calls[0][0] as string;
      const init = fetchSpy.mock.calls[0][1] as RequestInit;
      expect(url).toContain('/api/auth/sign-out');
      expect(init.method).toBe('POST');
    });

    it('does not throw on failure (best-effort)', async () => {
      fetchSpy.mockResolvedValue(jsonResponse({
        status: 500,
        ok: false,
        body: { error: 'whatever' },
      }));
      await expect(logout()).resolves.toBeUndefined();
    });
  });
});