import { h } from 'preact';
import EntityDetailPage from './EntityDetailPage';

interface Props { id: string; }
export default function MessageDetailPage({ id }: Props) {
  return <EntityDetailPage entity="messages" title="📨 Message" id={id} backTo="/admin/messages" />;
}
