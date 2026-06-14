import { h } from 'preact';
import EntityListPage from './EntityListPage';

export default function ClientsPage() {
  return (
    <EntityListPage
      entity="client-profiles"
      title="🏠 Clients"
      columns={["id", "user_id", "full_name", "phone", "city", "property_type", "preferred_contact"]}
      idKey="id"
      backTo="/admin"
    />
  );
}
