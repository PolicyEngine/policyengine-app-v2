import { useState } from 'react';
import AdminUserDetails from '@/components/admin/AdminUserDetails';
import AdminUserSearch from '@/components/admin/AdminUserSearch';
import MinimumUserType from '@/components/auth/MinimumUserType';
import { Stack, Text, Title } from '@/components/ui';
import { colors } from '@/designTokens';

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <Stack gap="xl" style={{ maxWidth: 960, margin: '0 auto', width: '100%' }}>
      {children}
    </Stack>
  );
}

/** What everyone but an admin sees: the page does not exist for them. */
function AdminPageNotFound() {
  return (
    <PageShell>
      <Title order={1} style={{ margin: 0 }}>
        Page not found
      </Title>
    </PageShell>
  );
}

function AdminUsers() {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  return (
    <PageShell>
      <Stack gap="xs">
        <Title order={1} style={{ margin: 0 }}>
          Users
        </Title>
        <Text style={{ margin: 0, color: colors.text.secondary }}>
          Find signed-in users by email, change their user types, and see who changed them.
        </Text>
      </Stack>
      <AdminUserSearch selectedUserId={selectedUserId} onSelectUser={setSelectedUserId} />
      {selectedUserId && <AdminUserDetails key={selectedUserId} userId={selectedUserId} />}
    </PageShell>
  );
}

/**
 * The admin users page (`/{countryId}/admin/users`): admins find signed-in
 * users, change their types and read each user's type changes. Everyone
 * else, signed out included, gets a not-found page once their type is
 * known, and nothing while it loads; no admin route is called for them.
 */
export default function AdminUsersPage() {
  return (
    <MinimumUserType minimum="admin" fallback={<AdminPageNotFound />}>
      <AdminUsers />
    </MinimumUserType>
  );
}
