import { h, RefObject } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import { useLanguage } from '../../i18n';
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';
import { mergeSpeechTranscript } from '../../lib/speechInput';

interface Props {
  onSend: (text: string) => void;
  disabled: boolean;
  inputRef?: RefObject<HTMLInputElement>;
}

export default function ChatInput({ onSend, disabled, inputRef }: Props) {
  const { t } = useLanguage();
  const [value, setValue] = useState('');
  const internalRef = useRef<HTMLInputElement>(null);
  const ref = inputRef ?? internalRef;

  const {
    isSupported: micSupported,
    isListening,
    toggle: toggleRecording,
    transcript,
    error: speechError,
  } = useSpeechRecognition();

  // Text present when listening began. Interim results REPLACE the live
  // speech segment (base + transcript) instead of appending each hypothesis.
  const speechBaseRef = useRef('');
  const valueRef = useRef(value);
  valueRef.current = value;

  const handleMic = () => {
    if (!isListening) {
      // Snapshot synchronously so the first onresult cannot race a useEffect.
      speechBaseRef.current = valueRef.current;
    }
    toggleRecording();
  };

  useEffect(() => {
    if (!transcript) return;
    setValue(mergeSpeechTranscript(speechBaseRef.current, transcript));
  }, [transcript]);

  // Focus the input when it becomes enabled
  useEffect(() => {
    if (!disabled) ref.current?.focus();
  }, [disabled]);

  const handleSend = () => {
    const text = value.trim();
    if (!text) return;
    onSend(text);
    setValue('');
    speechBaseRef.current = '';
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const micTitle = speechError
    ? t('chat.mic.unavailable')
    : isListening
      ? t('chat.mic.stop')
      : t('chat.mic.start');

  return (
    <div class="chat-input-wrap">
      {speechError && (
        <div class="voice-unavailable-banner" role="status">
          {t('chat.mic.unavailable')}
        </div>
      )}
      <div class="chat-input-bar">
        {micSupported && (
          <button
            class={`chat-mic-btn ${isListening ? 'chat-mic-recording' : ''} ${speechError ? 'chat-mic-error' : ''}`}
            onClick={handleMic}
            disabled={disabled}
            title={micTitle}
            aria-label={micTitle}
            type="button"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" y1="19" x2="12" y2="22" />
            </svg>
          </button>
        )}
        <input
          class="input"
          value={value}
          onInput={(e: Event) => setValue((e.currentTarget as HTMLInputElement).value)}
          onKeyDown={handleKeyDown}
          placeholder={
            speechError
              ? t('chat.mic.unavailable')
              : isListening
                ? t('chat.mic.listening')
                : t('chat.placeholder')
          }
          disabled={disabled}
          ref={ref}
        />
        <button class="chat-send-btn" onClick={handleSend} disabled={disabled || !value.trim()}>
          {disabled ? '...' : '↑'}
        </button>
      </div>
    </div>
  );
}
