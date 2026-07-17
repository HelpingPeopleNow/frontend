import { describe, it, expect } from 'vitest';
import { mergeSpeechTranscript } from '../../src/lib/speechInput';

describe('mergeSpeechTranscript', () => {
  it('replaces interim hypotheses instead of stacking (prod regression)', () => {
    // Real client conversation 8f884410… on 2026-07-17 stacked like:
    //   "hey" + "hey are you" + "hey are you doing"
    // → "hey hey are you hey are you doing"
    const interims = ['hey', 'hey are you', 'hey are you doing'];
    let value = '';
    const base = '';
    for (const t of interims) {
      value = mergeSpeechTranscript(base, t);
    }
    expect(value).toBe('hey are you doing');
  });

  it('keeps typed prefix while live speech updates', () => {
    const base = 'please note:';
    expect(mergeSpeechTranscript(base, 'I have a big apartment')).toBe(
      'please note: I have a big apartment',
    );
    expect(mergeSpeechTranscript(base, 'I have a big apartment that needs fixing')).toBe(
      'please note: I have a big apartment that needs fixing',
    );
  });

  it('returns base alone when transcript is empty', () => {
    expect(mergeSpeechTranscript('hello', '')).toBe('hello');
    expect(mergeSpeechTranscript('hello', '   ')).toBe('hello');
  });

  it('returns transcript alone when base is empty', () => {
    expect(mergeSpeechTranscript('', 'calle cimbel')).toBe('calle cimbel');
    expect(mergeSpeechTranscript('   ', 'calle cimbel')).toBe('calle cimbel');
  });
});
