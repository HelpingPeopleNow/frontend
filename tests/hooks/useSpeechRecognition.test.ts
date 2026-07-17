import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/preact';
import { useSpeechRecognition } from '../../src/hooks/useSpeechRecognition';

type Handlers = {
  onresult: ((event: unknown) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
};

class MockSpeechRecognition {
  continuous = false;
  interimResults = false;
  lang = '';
  start = vi.fn();
  stop = vi.fn();
  onresult: Handlers['onresult'] = null;
  onerror: Handlers['onerror'] = null;
  onend: Handlers['onend'] = null;

  /** Latest constructed instance for tests to fire events. */
  static last: MockSpeechRecognition | null = null;

  constructor() {
    MockSpeechRecognition.last = this;
  }
}

describe('useSpeechRecognition', () => {
  beforeEach(() => {
    MockSpeechRecognition.last = null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).SpeechRecognition = MockSpeechRecognition;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (window as any).webkitSpeechRecognition;
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (window as any).SpeechRecognition;
  });

  it('reports isSupported when SpeechRecognition exists', () => {
    const { result } = renderHook(() => useSpeechRecognition());
    expect(result.current.isSupported).toBe(true);
  });

  it('starts listening on toggle and sets isListening', () => {
    const { result } = renderHook(() => useSpeechRecognition());
    act(() => result.current.toggle());
    expect(MockSpeechRecognition.last?.start).toHaveBeenCalledOnce();
    expect(result.current.isListening).toBe(true);
  });

  it('surfaces network error to error state and stops listening', () => {
    const { result } = renderHook(() => useSpeechRecognition());
    act(() => result.current.toggle());
    expect(result.current.isListening).toBe(true);

    act(() => {
      MockSpeechRecognition.last?.onerror?.({ error: 'network' });
    });

    expect(result.current.error).toBe('network');
    expect(result.current.isListening).toBe(false);

    // onend must not clear the error (UI needs it)
    act(() => {
      MockSpeechRecognition.last?.onend?.();
    });
    expect(result.current.error).toBe('network');
  });

  it('does not set error for no-speech (transient)', () => {
    const { result } = renderHook(() => useSpeechRecognition());
    act(() => result.current.toggle());

    act(() => {
      MockSpeechRecognition.last?.onerror?.({ error: 'no-speech' });
    });

    expect(result.current.error).toBeNull();
  });

  it('clears error when user retries toggle', () => {
    const { result } = renderHook(() => useSpeechRecognition());
    act(() => result.current.toggle());
    act(() => {
      MockSpeechRecognition.last?.onerror?.({ error: 'not-allowed' });
    });
    expect(result.current.error).toBe('not-allowed');

    act(() => result.current.toggle());
    expect(result.current.error).toBeNull();
    expect(result.current.isListening).toBe(true);
  });

  it('accumulates final + interim into transcript', () => {
    const { result } = renderHook(() => useSpeechRecognition());
    act(() => result.current.toggle());

    act(() => {
      MockSpeechRecognition.last?.onresult?.({
        resultIndex: 0,
        results: {
          length: 1,
          0: { 0: { transcript: 'hello' }, length: 1, isFinal: false },
        },
      });
    });
    expect(result.current.transcript).toBe('hello');

    act(() => {
      MockSpeechRecognition.last?.onresult?.({
        resultIndex: 0,
        results: {
          length: 1,
          0: { 0: { transcript: 'hello world' }, length: 1, isFinal: true },
        },
      });
    });
    expect(result.current.transcript).toBe('hello world');
  });

  it('does not auto-restart after a fatal error (no second start on onend)', () => {
    const { result } = renderHook(() => useSpeechRecognition());
    act(() => result.current.toggle());
    const mock = MockSpeechRecognition.last!;
    const startsAfterToggle = mock.start.mock.calls.length;

    act(() => {
      mock.onerror?.({ error: 'network' });
      mock.onend?.();
    });

    expect(mock.start.mock.calls.length).toBe(startsAfterToggle);
    expect(result.current.isListening).toBe(false);
  });
});
