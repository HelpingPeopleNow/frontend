import { h } from 'preact';
import EntityListPage from './EntityListPage';

export default function ConversationsPage() {
  return (
    <EntityListPage
      entity="conversations"
      title="💬 Conversations"
      columns={["id", "user_id", "type", "created_at", "updated_at"]}
      idKey="id"
      backTo="/admin"
    />
  );
}
