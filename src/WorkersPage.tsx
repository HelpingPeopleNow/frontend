import { h } from 'preact';
import EntityListPage from './EntityListPage';

export default function WorkersPage() {
  return (
    <EntityListPage
      entity="worker-profiles"
      title="🔧 Workers"
      columns={["id", "user_id", "profession", "business_name", "city", "phone", "hourly_rate", "years_experience"]}
      idKey="id"
      backTo="/admin"
    />
  );
}
