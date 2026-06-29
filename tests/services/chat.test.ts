import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { sendChat } from '../../src/services/chat';
import { jsonResponse } from '../helpers/fetch';

describe('services/chat', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    fetchSpy = vi.spyOn(globalThis, 'fetch');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('POSTs to /api/v1/chat with the request body JSON-stringified', async () => {
    fetchSpy.mockResolvedValue(jsonResponse({ body: { answer: 'ok' } }));
    await sendChat({
      mode: 'worker_intake',
      message: 'I am a plumber',
      lang: 'en',
    });

    const url = fetchSpy.mock.calls[0][0] as string;
    const init = fetchSpy.mock.calls[0][1] as RequestInit;
    expect(url).toBe('/api/v1/chat');
    expect(init.method).toBe('POST');
    expect(init.credentials).toBe('include');
    expect(init.headers).toMatchObject({ 'Content-Type': 'application/json' });
    expect(JSON.parse(init.body as string)).toEqual({
      mode: 'worker_intake',
      message: 'I am a plumber',
      lang: 'en',
    });
  });

  it('passes through history and conversation_id when provided', async () => {
    fetchSpy.mockResolvedValue(jsonResponse({ body: { answer: 'ok' } }));
    await sendChat({
      mode: 'client_intake',
      message: 'follow-up',
      lang: 'es',
      history: [{ role: 'user', content: 'first' }],
      conversation_id: 'conv-1',
    });
    const init = fetchSpy.mock.calls[0][1] as RequestInit;
    const body = JSON.parse(init.body as string);
    expect(body.history).toEqual([{ role: 'user', content: 'first' }]);
    expect(body.conversation_id).toBe('conv-1');
  });

  it('returns the raw fetch Response for the caller to consume', async () => {
    const upstream = jsonResponse({ body: { answer: 'hi' } });
    fetchSpy.mockResolvedValue(upstream);
    const result = await sendChat({ mode: 'search', message: 'plumber', lang: 'en' });
    expect(result).toBe(upstream);
  });
});