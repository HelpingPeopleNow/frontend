import { h } from 'preact';
import EntityDetailPage from './EntityDetailPage';

interface Props { id: string; }
export default function ConversationDetailPage({ id }: Props) {
  return <EntityDetailPage entity="conversations" title="💬 Conversation" id={id} backTo="/admin/conversations" editable={false} />;
}
