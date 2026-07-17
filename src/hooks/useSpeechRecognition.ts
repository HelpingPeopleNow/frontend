import { useState, useCallback, useEffect, useRef } from 'preact/hooks';
import { log, logError } from '../lib/logger';

interface SpeechRecognitionAlternativeLike {
  transcript: string;
}

interface SpeechRecognitionResultItemLike {
  0: SpeechRecognitionAlternativeLike;
  length: number;
  isFinal: boolean;
}

interface SpeechRecognitionResultListLike {
  length: number;
  [index: number]: SpeechRecognitionResultItemLike;
}

interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: SpeechRecognitionResultListLike;
}

interface SpeechRecognitionErrorEventLike {
  error: string;
}

interface SpeechRecognitionLike {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

/** Transient errors — stop listening without surfacing a "voice unavailable" banner. */
const TRANSIENT_ERRORS = new Set(['no-speech', 'aborted']);

/**
 * Fatal/transport errors that mean voice input won't work right now.
 * Surfaced to the UI so the user can fall back to typing.
 */
const FATAL_ERRORS = new Set([
  'network',
  'not-allowed',
  'service-not-allowed',
  'audio-capture',
  'language-not-supported',
]);

export type SpeechRecognitionErrorCode =
  | 'network'
  | 'not-allowed'
  | 'service-not-allowed'
  | 'audio-capture'
  | 'language-not-supported'
  | 'start-failed'
  | string;

interface UseSpeechRecognitionReturn {
  isSupported: boolean;
  isListening: boolean;
  toggle: () => void;
  transcript: string;
  clearTranscript: () => void;
  /** Fatal error code when voice is unavailable; null when healthy. */
  error: SpeechRecognitionErrorCode | null;
  clearError: () => void;
}

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  }
}

export function useSpeechRecognition(): UseSpeechRecognitionReturn {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<SpeechRecognitionErrorCode | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const listeningRef = useRef(false);
  const erroredRef = useRef(false);
  const finalTextRef = useRef('');

  const isSupported =
    typeof window !== 'undefined' &&
    (typeof window.SpeechRecognition === 'function' ||
      typeof window.webkitSpeechRecognition === 'function');

  useEffect(() => {
    if (!isSupported) return;
    const Ctor = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Ctor) return;
    const recognition = new Ctor();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = (typeof navigator !== 'undefined' && navigator.language) || 'en-US';

    recognition.onresult = (event) => {
      let interim = '';
      // Accumulate from resultIndex for correctness; finals live in finalTextRef
      // so interim updates replace rather than re-append when the parent applies them.
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const text = result[0]?.transcript ?? '';
        if (result.isFinal) {
          finalTextRef.current += text + ' ';
        } else {
          interim += text;
        }
      }
      const combined = (finalTextRef.current + interim).trim();
      log('speech', 'transcript received', { combined });
      setTranscript(combined);
    };

    recognition.onerror = (event) => {
      logError('speech', `recognition error: ${event.error}`);
      // Transient: silence / user abort — no banner, just let onend settle.
      if (TRANSIENT_ERRORS.has(event.error)) {
        return;
      }
      // Fatal/transport: stop cleanly, do NOT auto-restart (avoids
      // start→error→end→start amplifying `network` into dozens of errors).
      erroredRef.current = true;
      listeningRef.current = false;
      setIsListening(false);
      if (FATAL_ERRORS.has(event.error) || event.error) {
        setError(event.error);
      }
    };

    recognition.onend = () => {
      log('speech', 'recognition ended');
      listeningRef.current = false;
      setIsListening(false);
      if (erroredRef.current) {
        // Keep `error` state for the UI; only clear the loop-guard flag.
        erroredRef.current = false;
      }
    };

    recognitionRef.current = recognition;
  }, [isSupported]);

  useEffect(() => {
    return () => {
      listeningRef.current = false;
      recognitionRef.current?.stop();
    };
  }, []);

  const clearError = useCallback(() => setError(null), []);
  const clearTranscript = useCallback(() => setTranscript(''), []);

  const toggle = useCallback(() => {
    const recognition = recognitionRef.current;
    if (!recognition) return;
    if (listeningRef.current) {
      listeningRef.current = false;
      recognition.stop();
      setIsListening(false);
    } else {
      // Fresh utterance session
      finalTextRef.current = '';
      setTranscript('');
      setError(null);
      erroredRef.current = false;
      try {
        recognition.start();
        listeningRef.current = true;
        setIsListening(true);
      } catch (err) {
        logError('speech', `start failed: ${String(err)}`);
        listeningRef.current = false;
        setIsListening(false);
        setError('start-failed');
      }
    }
  }, []);

  return {
    isSupported,
    isListening,
    toggle,
    transcript,
    clearTranscript,
    error,
    clearError,
  };
}
