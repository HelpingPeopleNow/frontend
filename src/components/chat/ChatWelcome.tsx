import { h } from 'preact';
import { useLanguage } from '../../i18n';

type ChatMode = 'worker_intake' | 'client_intake';

interface Props {
  mode: ChatMode;
}

export default function ChatWelcome({ mode }: Props) {
  const { t } = useLanguage();
  return (
    <div class="chat-welcome">
      <div class="chat-welcome-icon">💬</div>
      <h3>
        {mode === 'worker_intake'
          ? t('chat.welcome.worker.title')
          : t('chat.welcome.client.title')}
      </h3>
      <p>
        {mode === 'worker_intake'
          ? t('chat.welcome.worker.desc')
          : t('chat.welcome.client.desc')}
      </p>
    </div>
  );
}
