import { h } from 'preact';
import { useEffect } from 'preact/hooks';
import { route } from 'preact-router';
import { useLanguage } from './i18n';
import EntityListPage from './EntityListPage';

export default function DirectConversationsPage() {
  const { t } = useLanguage();

  // Deep-link support: the sentiment alert links to
  // /admin/direct-conversations?id=<uuid>. Redirect to the detail view.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    if (id) route(`/admin/direct-conversations/${id}`, true);
  }, []);

  return (
    <EntityListPage
      entity="direct-conversations"
      title={`📩 ${t('admin.menu.direct_conversations') || 'Direct Conversations'}`}
      columns={["id", "user_a_id", "user_b_id", "status", "last_message_at", "sentiment_score", "created_at"]}
      idKey="id"
      backTo="/admin"
      userColumns={["user_a_id", "user_b_id"]}
    />
  );
}
