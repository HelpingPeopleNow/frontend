import { h, RefObject } from 'preact';
import { useLanguage } from '../../i18n';
import { WorkerCard as WorkerCardData } from '../../services/chat';
import WorkerCard from './WorkerCard';

export interface ChatMsg {
  role: 'user' | 'assistant';
  text: string;
  workers?: WorkerCardData[];
}

interface Props {
  messages: ChatMsg[];
  isLoading: boolean;
  listRef: RefObject<HTMLDivElement>;
}

export default function ChatMessages({ messages, isLoading, listRef }: Props) {
  const { t } = useLanguage();

  return (
    <div class="chat-messages" ref={listRef}>
      {messages.map((m, i) => (
        <div
          key={i}
          class={`chat-bubble ${m.role === 'user' ? 'chat-bubble-user' : 'chat-bubble-assistant'}`}
        >
          {m.role === 'assistant' && <div class="chat-role-label">{t('chat.role.assistant')}</div>}
          <div class="chat-content">{m.text}</div>
          {m.workers && m.workers.length > 0 && (
            <div class="worker-card-grid" style={{ marginTop: 'var(--sp-3)' }}>
              {m.workers.map((w) => (
                <WorkerCard key={w.id} worker={w} />
              ))}
            </div>
          )}
          {m.workers && m.workers.length === 0 && (
            <div class="worker-card-empty">{t('client.find.no_results')}</div>
          )}
        </div>
      ))}
      {isLoading && (
        <div class="chat-bubble chat-bubble-assistant">
          <div class="chat-role-label">{t('chat.role.assistant')}</div>
          <div class="chat-typing">
            <span class="chat-typing-dot" />
            <span class="chat-typing-dot" />
            <span class="chat-typing-dot" />
          </div>
        </div>
      )}
    </div>
  );
}
