import { h } from 'preact';
import { useLanguage } from './i18n';
import EntityListPage from './EntityListPage';

export default function MessagesPage() {
  const { t } = useLanguage();
  return (
    <EntityListPage
      entity="messages"
      title={`📨 ${t('admin.menu.messages')}`}
      columns={["id", "conversation_id", "role", "content", "created_at"]}
      idKey="id"
      backTo="/admin"
    />
  );
}
