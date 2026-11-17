import { useState } from 'react';
import AdminPage from '@/components/admin/AdminPage';
import AdminUserDetails from '@/components/admin/AdminUserDetails';
import AdminUserSearch from '@/components/admin/AdminUserSearch';

function AdminUsers() {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  return (
    <>
      <AdminUserSearch selectedUserId={selectedUserId} onSelectUser={setSelectedUserId} />
      {selectedUserId && <AdminUserDetails key={selectedUserId} userId={selectedUserId} />}
    </>
  );
}

/**
 * The admin users page (`/{countryId}/admin/users`): admins find signed-in
 * users, change their types, read each user's type changes and saved
 * items, and delete their accounts. Everyone else, signed out included,
 * gets a not-found page once their type is known, and no admin route is
 * called for them (see `AdminPage`).
 */
export default function AdminUsersPage() {
  return (
    <AdminPage title="Users">
      <AdminUsers />
    </AdminPage>
  );
}
