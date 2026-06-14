import { h } from 'preact';
import EntityListPage from './EntityListPage';

export default function UsersPage() {
  return (
    <EntityListPage
      entity="users"
      title="👤 Users"
      columns={["id", "name", "email", "role", "emailVerified", "createdAt"]}
      idKey="id"
      backTo="/admin"
    />
  );
}
