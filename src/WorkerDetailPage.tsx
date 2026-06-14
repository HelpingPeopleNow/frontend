import { h } from 'preact';
import EntityDetailPage from './EntityDetailPage';

interface Props { id: string; }
export default function WorkerDetailPage({ id }: Props) {
  return <EntityDetailPage entity="worker-profiles" title="🔧 Worker" id={id} backTo="/admin/worker-profiles" />;
}
