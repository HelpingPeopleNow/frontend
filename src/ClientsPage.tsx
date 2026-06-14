import { h } from 'preact';
import { useLanguage } from './i18n';
import EntityListPage from './EntityListPage';

export default function ClientsPage() {
  const { t } = useLanguage();
  return (
    <EntityListPage
      entity="client-profiles"
      title={`🏠 ${t('admin.menu.clients')}`}
      columns={["id", "user_id", "full_name", "phone", "city", "property_type", "preferred_contact"]}
      idKey="id"
      backTo="/admin"
    />
  );
}
