import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  listEntities,
  getEntity,
  updateEntity,
  deleteEntity,
} from '../../src/services/admin';
import { jsonResponse } from '../helpers/fetch';

describe('services/admin', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    fetchSpy = vi.spyOn(globalThis, 'fetch');
  });

  describe('listEntities', () => {
    it('GETs /api/v1/admin/{entity}?limit=200 by default', async () => {
      fetchSpy.mockResolvedValue(jsonResponse({ body: [] }));
      await listEntities('users');
      const url = fetchSpy.mock.calls[0][0] as string;
      expect(url).toContain('/api/v1/admin/users');
      expect(url).toContain('limit=200');
    });

    it('honors a custom limit', async () => {
      fetchSpy.mockResolvedValue(jsonResponse({ body: [] }));
      await listEntities('worker-profiles', 25);
      const url = fetchSpy.mock.calls[0][0] as string;
      expect(url).toContain('limit=25');
    });
  });

  describe('getEntity', () => {
    it('GETs /api/v1/admin/{entity}/{id}', async () => {
      fetchSpy.mockResolvedValue(jsonResponse({ body: { id: 'u-1' } }));
      await getEntity('users', 'u-1');
      const url = fetchSpy.mock.calls[0][0] as string;
      expect(url).toBe('/api/v1/admin/users/u-1');
    });
  });

  describe('updateEntity', () => {
    it('PUTs JSON body to /api/v1/admin/{entity}/{id}', async () => {
      fetchSpy.mockResolvedValue(jsonResponse({ body: { ok: true, rows_affected: 1 } }));
      await updateEntity('users', 'u-1', { is_admin: true });
      const url = fetchSpy.mock.calls[0][0] as string;
      const init = fetchSpy.mock.calls[0][1] as RequestInit;
      expect(url).toBe('/api/v1/admin/users/u-1');
      expect(init.method).toBe('PUT');
      expect(JSON.parse(init.body as string)).toEqual({ is_admin: true });
    });
  });

  describe('deleteEntity', () => {
    it('DELETEs /api/v1/admin/{entity}/{id}', async () => {
      fetchSpy.mockResolvedValue(jsonResponse({ body: { ok: true, rows_affected: 1 } }));
      await deleteEntity('users', 'u-1');
      const url = fetchSpy.mock.calls[0][0] as string;
      const init = fetchSpy.mock.calls[0][1] as RequestInit;
      expect(url).toBe('/api/v1/admin/users/u-1');
      expect(init.method).toBe('DELETE');
    });
  });
});