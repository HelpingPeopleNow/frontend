import { h } from 'preact';
import { useLanguage } from './i18n';
import EntityListPage from './EntityListPage';

export default function WorkersPage() {
  const { t } = useLanguage();
  return (
    <EntityListPage
      entity="worker-profiles"
      title={`🔧 ${t('admin.menu.workers')}`}
      columns={["id", "user_id", "profession", "business_name", "city", "phone", "hourly_rate", "years_experience"]}
      idKey="id"
      backTo="/admin"
    />
  );
}
