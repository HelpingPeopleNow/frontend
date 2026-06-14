import { h } from 'preact';
import { useLanguage } from './i18n';
import EntityListPage from './EntityListPage';

export default function UsersPage() {
  const { t } = useLanguage();
  return (
    <EntityListPage
      entity="users"
      title={`👤 ${t('admin.menu.users')}`}
      columns={["id", "name", "email", "is_admin", "emailVerified", "createdAt"]}
      idKey="id"
      backTo="/admin"
    />
  );
}
