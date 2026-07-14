import { h } from 'preact';
import { useLanguage } from './i18n';
import EntityListPage from './EntityListPage';

export default function DirectConversationsPage() {
  const { t } = useLanguage();
  return (
    <EntityListPage
      entity="direct-conversations"
      title={`📩 ${t('admin.menu.direct_conversations') || 'Direct Conversations'}`}
      columns={["id", "user_a_id", "user_b_id", "status", "last_message_at", "sentiment_score", "created_at"]}
      idKey="id"
      backTo="/admin"
      linkable={false}
    />
  );
}
