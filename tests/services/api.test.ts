import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ApiError, request } from '../../src/services/api';
import { jsonResponse } from '../helpers/fetch';

describe('services/api', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    fetchSpy = vi.spyOn(globalThis, 'fetch');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('request()', () => {
    it('uses Content-Type application/json and credentials include', async () => {
      fetchSpy.mockResolvedValue(jsonResponse({ body: { ok: true } }));
      await request('/api/test');

      const init = fetchSpy.mock.calls[0][1] as RequestInit;
      expect(init.credentials).toBe('include');
      expect(init.headers).toMatchObject({ 'Content-Type': 'application/json' });
      expect(init.method).toBeUndefined();
    });

    it('preserves caller-supplied headers and overrides Content-Type', async () => {
      fetchSpy.mockResolvedValue(jsonResponse({ body: { ok: true } }));
      await request('/api/test', {
        headers: { 'X-Custom': 'value', 'Content-Type': 'application/xml' },
      });

      const init = fetchSpy.mock.calls[0][1] as RequestInit;
      expect(init.headers).toEqual({
        'Content-Type': 'application/xml',
        'X-Custom': 'value',
      });
    });

    it('passes method and body through unchanged', async () => {
      fetchSpy.mockResolvedValue(jsonResponse({ body: { ok: true } }));
      await request('/api/x', { method: 'POST', body: '{"a":1}' });
      const init = fetchSpy.mock.calls[0][1] as RequestInit;
      expect(init.method).toBe('POST');
      expect(init.body).toBe('{"a":1}');
    });

    it('returns parsed JSON body on success', async () => {
      fetchSpy.mockResolvedValue(jsonResponse({ body: { foo: 'bar' } }));
      const result = await request<{ foo: string }>('/api/x');
      expect(result).toEqual({ foo: 'bar' });
    });

    it('returns undefined on 204 No Content', async () => {
      fetchSpy.mockResolvedValue(jsonResponse({ status: 204, ok: true }));
      const result = await request<void>('/api/delete');
      expect(result).toBeUndefined();
    });

    it('throws ApiError with status, message, and path on non-OK responses', async () => {
      fetchSpy.mockResolvedValue(jsonResponse({
        status: 400,
        ok: false,
        body: { error: 'bad input' },
      }));

      await expect(request('/api/x')).rejects.toMatchObject({
        name: 'ApiError',
        status: 400,
        message: 'bad input',
        path: '/api/x',
      });
    });

    it('falls back to a default error message when body has no error field', async () => {
      fetchSpy.mockResolvedValue(jsonResponse({
        status: 500,
        ok: false,
        body: {},
      }));

      await expect(request('/api/x')).rejects.toMatchObject({
        status: 500,
        message: 'Request failed with status 500',
      });
    });

    it('falls back to a default error message when body parsing fails', async () => {
      fetchSpy.mockResolvedValue(jsonResponse({
        status: 502,
        ok: false,
        parseError: true,
      }));

      await expect(request('/api/x')).rejects.toMatchObject({
        status: 502,
        message: 'Request failed with status 502',
      });
    });

    it('ApiError is a real Error instance', async () => {
      fetchSpy.mockResolvedValue(jsonResponse({
        status: 403,
        ok: false,
        body: { error: 'forbidden' },
      }));

      await expect(request('/api/x')).rejects.toBeInstanceOf(Error);
    });
  });

  describe('ApiError', () => {
    it('exposes status, message, and path as own properties', () => {
      const e = new ApiError(404, 'not found', '/api/foo');
      expect(e.status).toBe(404);
      expect(e.path).toBe('/api/foo');
      expect(e.message).toBe('not found');
      expect(e.name).toBe('ApiError');
    });
  });
});