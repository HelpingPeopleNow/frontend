import { h } from 'preact';
import EntityDetailPage from './EntityDetailPage';

interface Props { id: string; }
export default function ClientDetailPage({ id }: Props) {
  return <EntityDetailPage entity="client-profiles" title="🏠 Client" id={id} backTo="/admin/client-profiles" />;
}
