import { useState, useCallback, useEffect, useRef } from 'preact/hooks';

interface SpeechRecognitionResultLike {
  transcript: string;
}

interface SpeechRecognitionResultsLike {
  0: SpeechRecognitionResultLike;
  length: number;
}

interface SpeechRecognitionEventLike {
  results: SpeechRecognitionResultsLike[];
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

import { log, logError } from '../lib/logger';

interface UseSpeechRecognitionReturn {
  isSupported: boolean;
  isListening: boolean;
  toggle: () => void;
  transcript: string;
  clearTranscript: () => void;
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
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const listeningRef = useRef(false);

  const isSupported = typeof window !== 'undefined' &&
    (typeof window.SpeechRecognition === 'function' ||
      typeof window.webkitSpeechRecognition === 'function');

  useEffect(() => {
    if (!isSupported) return;
    const Ctor = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Ctor) return;
    const recognition = new Ctor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = (typeof navigator !== 'undefined' && navigator.language) || 'en-US';

    let finalText = '';

    recognition.onresult = (event) => {
      let interim = '';
      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        const text = result[0]?.transcript ?? '';
        if (result.length > 0 && (result as unknown as { isFinal: boolean }).isFinal) {
          finalText += text + ' ';
        } else {
          interim += text;
        }
      }
      const combined = (finalText + interim).trim();
      log('speech', 'transcript received', { combined });
      setTranscript(combined);
    };
    recognition.onerror = (event) => {
      logError('speech', `recognition error: ${event.error}`);
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        listeningRef.current = false;
        setIsListening(false);
      }
    };
    recognition.onend = () => {
      log('speech', 'recognition ended');
      if (listeningRef.current) {
        // Auto-stopped (silence/continuous boundary). Restart while still toggled on.
        try {
          recognition.start();
          return;
        } catch {
          listeningRef.current = false;
          setIsListening(false);
        }
      }
      listeningRef.current = false;
      setIsListening(false);
    };
    recognitionRef.current = recognition;
  }, [isSupported]);

  useEffect(() => {
    return () => {
      listeningRef.current = false;
      recognitionRef.current?.stop();
    };
  }, []);

  const toggle = useCallback(() => {
    const recognition = recognitionRef.current;
    if (!recognition) return;
    if (listeningRef.current) {
      listeningRef.current = false;
      recognition.stop();
      setIsListening(false);
    } else {
      setTranscript('');
      try {
        recognition.start();
        listeningRef.current = true;
        setIsListening(true);
      } catch (err) {
        logError('speech', `start failed: ${String(err)}`);
      }
    }
  }, []);

  return { isSupported, isListening, toggle, transcript, clearTranscript: () => setTranscript('') };
}
