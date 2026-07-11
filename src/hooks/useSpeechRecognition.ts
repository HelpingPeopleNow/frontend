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

  const isSupported = typeof window !== 'undefined' &&
    (typeof window.SpeechRecognition === 'function' ||
      typeof window.webkitSpeechRecognition === 'function');

  useEffect(() => {
    if (!isSupported) return;
    const Ctor = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Ctor) return;
    const recognition = new Ctor();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = (typeof navigator !== 'undefined' && navigator.language) || 'en-US';

    recognition.onresult = (event) => {
      const text = event.results[0][0].transcript;
      log('speech', 'transcript received', { text });
      setTranscript(text);
      setIsListening(false);
    };
    recognition.onerror = (event) => {
      logError('speech', `recognition error: ${event.error}`);
      setIsListening(false);
    };
    recognition.onend = () => {
      log('speech', 'recognition ended');
      setIsListening(false);
    };
    recognitionRef.current = recognition;
  }, [isSupported]);

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
    };
  }, []);

  const toggle = useCallback(() => {
    const recognition = recognitionRef.current;
    if (!recognition) return;
    if (isListening) {
      recognition.stop();
      setIsListening(false);
    } else {
      setTranscript('');
      recognition.start();
      setIsListening(true);
    }
  }, [isListening]);

  return { isSupported, isListening, toggle, transcript };
}
