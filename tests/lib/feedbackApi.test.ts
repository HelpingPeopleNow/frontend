import { describe, it, expect, vi, beforeEach } from 'vitest';
import { submitFeedback } from '../../src/lib/feedbackApi';
import { jsonResponse } from '../helpers/fetch';

describe('lib/feedbackApi', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    fetchSpy = vi.spyOn(globalThis, 'fetch');
  });

  it('POSTs the feedback payload to /api/v1/feedback and returns the created record', async () => {
    const created = {
      id: 'fb-1',
      user_id: 'u-1',
      page_url: '/find',
      message: 'search is slow',
      category: 'complaint',
      status: 'open',
      admin_note: null,
      created_at: '2026-08-24T00:00:00Z',
      updated_at: '2026-08-24T00:00:00Z',
    };
    fetchSpy.mockResolvedValue(jsonResponse({ body: created }));

    const result = await submitFeedback({
      message: 'search is slow',
      page_url: '/find',
      category: 'complaint',
    });

    const url = fetchSpy.mock.calls[0][0] as string;
    const init = fetchSpy.mock.calls[0][1] as RequestInit;
    expect(url).toBe('/api/v1/feedback');
    expect(init.method).toBe('POST');
    expect(init.credentials).toBe('include');
    expect(JSON.parse(init.body as string)).toEqual({
      message: 'search is slow',
      page_url: '/find',
      category: 'complaint',
    });
    expect(result).toEqual(created);
  });
});
