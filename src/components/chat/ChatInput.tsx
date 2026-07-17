import { h, RefObject } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import { useLanguage } from '../../i18n';
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';

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

  const { isSupported: micSupported, isListening, toggle: toggleRecording, transcript, clearTranscript } = useSpeechRecognition();

  // Keep a fresh ref to value so the transcript effect never sees a stale closure
  const valueRef = useRef(value);
  valueRef.current = value;

  // Append recognized speech to the input, then clear it so repeats append cleanly
  useEffect(() => {
    if (transcript) {
      setValue((prev) => (prev ? prev + ' ' + transcript : transcript).trimStart());
      clearTranscript();
    }
  }, [transcript, clearTranscript]);

  // Focus the input when it becomes enabled
  useEffect(() => {
    if (!disabled) ref.current?.focus();
  }, [disabled]);

  const handleSend = () => {
    const text = value.trim();
    if (!text) return;
    onSend(text);
    setValue('');
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div class="chat-input-bar">
      {micSupported && (
        <button
          class={`chat-mic-btn ${isListening ? 'chat-mic-recording' : ''}`}
          onClick={toggleRecording}
          disabled={disabled}
          title={isListening ? t('chat.mic.stop') : t('chat.mic.start')}
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
        placeholder={isListening ? t('chat.mic.listening') : t('chat.placeholder')}
        disabled={disabled}
        ref={ref}
      />
      <button class="chat-send-btn" onClick={handleSend} disabled={disabled || !value.trim()}>
        {disabled ? '...' : '↑'}
      </button>
    </div>
  );
}
