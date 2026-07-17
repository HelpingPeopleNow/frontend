/**
 * Merge a live speech transcript into an input field without stacking
 * interim updates.
 *
 * Web Speech API fires many interim results for the same utterance, each a
 * *replacement* of the previous hypothesis (e.g. "hey" → "hey are you" →
 * "hey are you doing"). Applying them with append produces garbage like:
 *   "hey hey are you hey are you doing"
 *
 * `base` is the input text at the moment listening started (typed text or
 * previous committed speech). The live segment is always `base + transcript`.
 */
export function mergeSpeechTranscript(base: string, transcript: string): string {
  const t = transcript.trim();
  if (!t) return base;
  const b = base.trimEnd();
  if (!b) return t;
  return `${b} ${t}`;
}
