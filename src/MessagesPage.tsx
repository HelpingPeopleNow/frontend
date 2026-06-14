import { h } from 'preact';
import EntityListPage from './EntityListPage';

export default function MessagesPage() {
  return (
    <EntityListPage
      entity="messages"
      title="📨 Messages"
      columns={["id", "conversation_id", "role", "content", "created_at"]}
      idKey="id"
      backTo="/admin"
    />
  );
}
