import { h } from 'preact';
import { useEffect } from 'preact/hooks';
import { useGeolocation } from './hooks/useGeolocation';
import { useAuth } from './AuthProvider';
import { useLanguage } from './i18n';
import AppShell from './AppShell';
import ModeChooser from './ModeChooser';
import { useChatInit } from './hooks/useChatInit';
import { useChat } from './hooks/useChat';
import ChatMessages from './components/chat/ChatMessages';
import ChatInput from './components/chat/ChatInput';
import ChatWelcome from './components/chat/ChatWelcome';

type ChatMode = 'worker_intake' | 'client_intake';

function getModeParam(): ChatMode | null {
  const mp = new URLSearchParams(window.location.search).get('mode');
  if (mp === 'worker_intake' || mp === 'client_intake') return mp;
  return null;
}

export default function ChatPage() {
  useAuth();
  const { t, lang } = useLanguage();
  const geo = useGeolocation();
  const modeParam = getModeParam();
  const convType = modeParam === 'worker_intake' ? 'worker' : 'client';

  const { initialMessages, initialConversationId, loading: initialLoading } = useChatInit(convType);

  const { messages, isLoading, isStreaming, sendMessage, listRef } = useChat({
    mode: modeParam || '',
    lang,
    latitude: geo.latitude,
    longitude: geo.longitude,
    initialMessages,
    initialConversationId,
    errorMessage: t('chat.error.network'),
  });

  useEffect(() => {
    if (modeParam === 'worker_intake') document.title = `${t('worker.title')} | Helping People`;
    else if (modeParam === 'client_intake') document.title = `${t('client.title')} | Helping People`;
    else document.title = `Helping People`;
  }, [modeParam, t]);

  const pageHeading =
    modeParam === 'worker_intake'
      ? t('worker.title')
      : modeParam === 'client_intake'
        ? t('client.title')
        : t('chooser.title');

  if (!modeParam) {
    return (
      <AppShell currentPath="/" title={t('chooser.title')}>
        <ModeChooser />
      </AppShell>
    );
  }

  return (
    <AppShell currentPath="/" title={pageHeading}>
      <div class="chat-container">
        {!geo.loading && geo.permissionDenied && (
          <div class="location-banner">
            <span class="location-banner-text">
              📍 {t('chat.location.denied')}
            </span>
          </div>
        )}
        {messages.length === 0 && !initialLoading ? (
          <ChatWelcome mode={modeParam!} />
        ) : (
          <ChatMessages
            messages={messages}
            isLoading={isLoading || isStreaming}
            listRef={listRef}
          />
        )}
        <ChatInput onSend={sendMessage} disabled={isLoading || isStreaming} />
      </div>
    </AppShell>
  );
}
