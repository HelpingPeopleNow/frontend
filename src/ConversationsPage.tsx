import { h } from 'preact';
import { useLanguage } from './i18n';
import EntityListPage from './EntityListPage';

export default function ConversationsPage() {
  const { t } = useLanguage();
  return (
    <EntityListPage
      entity="conversations"
      title={`💬 ${t('admin.menu.conversations')}`}
      columns={["id", "user_id", "type", "created_at", "updated_at"]}
      idKey="id"
      backTo="/admin"
      linkable={false}
    />
  );
}
