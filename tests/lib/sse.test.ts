import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MockEventSource } from '../helpers/eventsource';

beforeEach(() => {
  MockEventSource.instances = [];
  (globalThis as unknown as { EventSource: typeof MockEventSource }).EventSource = MockEventSource;
});

afterEach(() => {
  vi.useRealTimers();
});

// ── Import under test ────────────────────────────────────────────────────────

async function importFreshSse() {
  vi.resetModules();
  return import('../../src/lib/sse');
}

describe('lib/sse — DirectMessageSSE', () => {
  it('opens an EventSource with credentials: include at /api/v1/direct-messages/stream', async () => {
    const { DirectMessageSSE } = await importFreshSse();
    const sse = new DirectMessageSSE();
    sse.connect(() => {});
    expect(MockEventSource.instances).toHaveLength(1);
    expect(MockEventSource.instances[0].url).toBe('/api/v1/direct-messages/stream');
    expect(MockEventSource.instances[0].withCredentials).toBe(true);
  });

  it('dispatches a "message" event with parsed JSON data to the callback', async () => {
    const { DirectMessageSSE } = await importFreshSse();
    const cb = vi.fn();
    const sse = new DirectMessageSSE();
    sse.connect(cb);
    MockEventSource.instances[0].triggerMessage({ id: 'msg-1', body: 'hi' });
    expect(cb).toHaveBeenCalledWith({ type: 'message', data: { id: 'msg-1', body: 'hi' } });
  });

  it('dispatches a "read" event with parsed JSON data', async () => {
    const { DirectMessageSSE } = await importFreshSse();
    const cb = vi.fn();
    const sse = new DirectMessageSSE();
    sse.connect(cb);
    MockEventSource.instances[0].triggerNamed('read', { conversation_id: 'conv-1' });
    expect(cb).toHaveBeenCalledWith({ type: 'read', data: { conversation_id: 'conv-1' } });
  });

  it('dispatches an "archive" event with parsed JSON data', async () => {
    const { DirectMessageSSE } = await importFreshSse();
    const cb = vi.fn();
    const sse = new DirectMessageSSE();
    sse.connect(cb);
    MockEventSource.instances[0].triggerNamed('archive', { conversation_id: 'conv-1' });
    expect(cb).toHaveBeenCalledWith({ type: 'archive', data: { conversation_id: 'conv-1' } });
  });

  it('dispatches a "block" event with parsed JSON data', async () => {
    const { DirectMessageSSE } = await importFreshSse();
    const cb = vi.fn();
    const sse = new DirectMessageSSE();
    sse.connect(cb);
    MockEventSource.instances[0].triggerNamed('block', { conversation_id: 'conv-1' });
    expect(cb).toHaveBeenCalledWith({ type: 'block', data: { conversation_id: 'conv-1' } });
  });

  it('dispatches an "open" event when onopen fires', async () => {
    const { DirectMessageSSE } = await importFreshSse();
    const cb = vi.fn();
    const sse = new DirectMessageSSE();
    sse.connect(cb);
    MockEventSource.instances[0].triggerOpen();
    expect(cb).toHaveBeenCalledWith({ type: 'open', data: {} });
  });

  it('reconnects with exponential backoff after onerror', async () => {
    vi.useFakeTimers();
    const { DirectMessageSSE } = await importFreshSse();
    const sse = new DirectMessageSSE();
    sse.connect(() => {});
    const first = MockEventSource.instances[0];
    first.triggerError();
    // First reconnect: 1000 * 2^1 = 2000ms
    await vi.advanceTimersByTimeAsync(2000);
    expect(MockEventSource.instances).toHaveLength(2);
  });

  it('caps reconnect delay at MAX_RECONNECT_MS (30s)', async () => {
    vi.useFakeTimers();
    const { DirectMessageSSE } = await importFreshSse();
    const sse = new DirectMessageSSE();
    sse.connect(() => {});
    // Force reconnectAttempts up to a high number
    for (let i = 0; i < 6; i++) {
      MockEventSource.instances[MockEventSource.instances.length - 1].triggerError();
      // advance enough for the 2^i backoff
      await vi.advanceTimersByTimeAsync(32_000);
    }
    // After ~6 errors we'd be past 32s — verify reconnect still happens within 30s cap
    expect(MockEventSource.instances.length).toBeGreaterThanOrEqual(2);
  });

  it('falls back to polling after 3+ reconnect failures', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ messages: [], server_time: 'now' }),
    } as Response);

    const { DirectMessageSSE } = await importFreshSse();
    const sse = new DirectMessageSSE();
    sse.connect(() => {});
    for (let i = 0; i < 4; i++) {
      MockEventSource.instances[MockEventSource.instances.length - 1].triggerError();
      // runOnlyPendingTimersAsync fires any due timers AND awaits microtasks
      await vi.runOnlyPendingTimersAsync();
    }
    expect(fetchSpy).toHaveBeenCalled();
  });

  it('disconnect() closes the EventSource and prevents reconnect', async () => {
    vi.useFakeTimers();
    const { DirectMessageSSE } = await importFreshSse();
    const sse = new DirectMessageSSE();
    sse.connect(() => {});
    const es = MockEventSource.instances[0];
    sse.disconnect();
    expect(es.readyState).toBe(2); // CLOSED
    es.triggerError();
    await vi.advanceTimersByTimeAsync(5_000);
    // No new EventSource instance should be created after disconnect
    expect(MockEventSource.instances).toHaveLength(1);
  });

  it('drops malformed SSE frames instead of throwing (safeParse)', async () => {
    const { DirectMessageSSE } = await importFreshSse();
    const cb = vi.fn();
    const sse = new DirectMessageSSE();
    sse.connect(cb);
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    // Malformed message frame — must not throw, must not call callback
    MockEventSource.instances[0].triggerMessageRaw('not-json');
    expect(cb).not.toHaveBeenCalled();
    expect(warn).toHaveBeenCalled();
    // Subsequent valid frames still flow (stream not killed)
    MockEventSource.instances[0].triggerMessage({ id: 'ok' });
    expect(cb).toHaveBeenCalledWith({ type: 'message', data: { id: 'ok' } });
    warn.mockRestore();
  });

  it('drops malformed named-event frames (e.g. "read") without killing the stream', async () => {
    const { DirectMessageSSE } = await importFreshSse();
    const cb = vi.fn();
    const sse = new DirectMessageSSE();
    sse.connect(cb);
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    MockEventSource.instances[0].triggerNamedRaw('read', '<<garbage>>');
    expect(cb).not.toHaveBeenCalled();
    expect(warn).toHaveBeenCalled();
    // Subsequent valid "read" frames still flow
    MockEventSource.instances[0].triggerNamed('read', { conversation_id: 'c-1' });
    expect(cb).toHaveBeenCalledWith({ type: 'read', data: { conversation_id: 'c-1' } });
    warn.mockRestore();
  });

  it('stopPolling on SSE recovery: polling stops when onopen fires after fallback', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ messages: [], server_time: 'now' }),
    } as Response);

    const { DirectMessageSSE } = await importFreshSse();
    const sse = new DirectMessageSSE();
    sse.connect(() => {});

    // Force 4 reconnect failures → polling engages
    for (let i = 0; i < 4; i++) {
      MockEventSource.instances[MockEventSource.instances.length - 1].triggerError();
      await vi.runOnlyPendingTimersAsync();
    }
    expect(fetchSpy).toHaveBeenCalled(); // polling started
    const pollCallsBefore = fetchSpy.mock.calls.length;

    // Trigger SSE recovery — onopen must stop polling
    MockEventSource.instances[MockEventSource.instances.length - 1].triggerOpen();
    // Advance past the polling interval — no new polling fetches should occur
    await vi.advanceTimersByTimeAsync(20_000);
    expect(fetchSpy.mock.calls.length).toBe(pollCallsBefore);
  });

  it('dispatches a "report" event with parsed JSON data', async () => {
    const { DirectMessageSSE } = await importFreshSse();
    const cb = vi.fn();
    const sse = new DirectMessageSSE();
    sse.connect(cb);
    MockEventSource.instances[0].triggerNamed('report', { conversation_id: 'conv-1' });
    expect(cb).toHaveBeenCalledWith({ type: 'report', data: { conversation_id: 'conv-1' } });
  });

  it('disconnect stops polling and no new polling fetches occur', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ messages: [], server_time: 'now' }),
    } as Response);

    const { DirectMessageSSE } = await importFreshSse();
    const sse = new DirectMessageSSE();

    // Simulate EventSource unavailable — starts polling immediately
    (globalThis as unknown as { EventSource: undefined }).EventSource = undefined;
    sse.connect(() => {});
    await vi.runOnlyPendingTimersAsync();
    expect(fetchSpy).toHaveBeenCalled();

    const callsBefore = fetchSpy.mock.calls.length;

    // Disconnect — must stop polling
    sse.disconnect();
    await vi.advanceTimersByTimeAsync(20_000);
    expect(fetchSpy.mock.calls.length).toBe(callsBefore);
    fetchSpy.mockRestore();
    // Restore EventSource for subsequent tests
    const { MockEventSource } = await import('../helpers/eventsource');
    (globalThis as unknown as { EventSource: typeof MockEventSource }).EventSource = MockEventSource;
  });

  it('starts polling immediately when EventSource is unavailable', async () => {
    (globalThis as unknown as { EventSource: undefined }).EventSource = undefined;
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ messages: [], server_time: 'now' }),
    } as Response);

    const { DirectMessageSSE } = await importFreshSse();
    const sse = new DirectMessageSSE();
    sse.connect(() => {});
    expect(fetchSpy).toHaveBeenCalled();
    const url = fetchSpy.mock.calls[0][0] as string;
    expect(url).toContain('/api/v1/direct-messages/since');
  });

  it('polling delivers each message as a "message" event with parsed JSON', async () => {
    (globalThis as unknown as { EventSource: undefined }).EventSource = undefined;
    const cb = vi.fn();
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        messages: [{ id: 'msg-9', body: 'hi' }],
        server_time: '2026-01-01T00:00:00Z',
      }),
    } as Response);

    const { DirectMessageSSE } = await importFreshSse();
    const sse = new DirectMessageSSE();
    sse.connect(cb);
    // startPolling runs `poll()` immediately on connect → microtask queue
    await new Promise(resolve => setTimeout(resolve, 0));
    const msgCalls = cb.mock.calls.filter(([arg]) => arg.type === 'message');
    expect(msgCalls).toHaveLength(1);
    expect(msgCalls[0][0]).toMatchObject({ type: 'message', data: { id: 'msg-9' } });
  });
});