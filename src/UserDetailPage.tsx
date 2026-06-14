import { h } from 'preact';
import EntityDetailPage from './EntityDetailPage';

interface Props { id: string; }
export default function UserDetailPage({ id }: Props) {
  return <EntityDetailPage entity="users" title="👤 User" id={id} backTo="/admin/users" />;
}
