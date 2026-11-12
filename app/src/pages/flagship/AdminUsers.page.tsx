import { useState } from 'react';
import AdminInvitations from '@/components/admin/AdminInvitations';
import AdminUserDetails from '@/components/admin/AdminUserDetails';
import AdminUserSearch from '@/components/admin/AdminUserSearch';
import MinimumUserType from '@/components/auth/MinimumUserType';
import {
  Button,
  Spinner,
  Stack,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Text,
  Title,
} from '@/components/ui';
import { colors, spacing } from '@/designTokens';
import { useMe } from '@/hooks/useMe';
import { useUserType } from '@/hooks/useUserType';

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <Stack gap="xl" style={{ maxWidth: spacing.layout.container, margin: '0 auto', width: '100%' }}>
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

/**
 * While the signed-in user's type is not known: loading while /v2/me runs,
 * or its error, with "Try again", when it failed without an answer.
 */
function UserTypeNotKnown() {
  const me = useMe();
  if (me.isError) {
    return (
      <PageShell>
        <Text role="alert" style={{ margin: 0, color: colors.error }}>
          We could not load your PolicyEngine account: {me.error.message}
        </Text>
        <div>
          <Button onClick={() => me.refetch()}>Try again</Button>
        </div>
      </PageShell>
    );
  }
  return (
    <PageShell>
      <Stack role="status" aria-live="polite" align="center" gap="md">
        <Spinner size="sm" />
        <Text style={{ margin: 0, color: colors.text.secondary }}>Loading…</Text>
      </Stack>
    </PageShell>
  );
}

function AdminUsers() {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [openTab, setOpenTab] = useState('users');
  return (
    <PageShell>
      <Stack gap="xs">
        <Title order={1} style={{ margin: 0 }}>
          Users
        </Title>
        <Text style={{ margin: 0, color: colors.text.secondary }}>
          Find signed-in users by email, change their user types, and see who changed them, or
          invite people by email to become authors or admins.
        </Text>
      </Stack>
      <Tabs value={openTab} onValueChange={setOpenTab}>
        <TabsList>
          <TabsTrigger value="users">Find users</TabsTrigger>
          <TabsTrigger value="invitations">Invitations</TabsTrigger>
        </TabsList>
        {/* Kept rendered while hidden, so a search survives a visit to the invitations. */}
        <TabsContent value="users" forceMount hidden={openTab !== 'users'}>
          <Stack gap="xl">
            <AdminUserSearch selectedUserId={selectedUserId} onSelectUser={setSelectedUserId} />
            {selectedUserId && <AdminUserDetails key={selectedUserId} userId={selectedUserId} />}
          </Stack>
        </TabsContent>
        {/* Rendered only while open, so the invitations are read when their tab opens. */}
        <TabsContent value="invitations">
          <AdminInvitations />
        </TabsContent>
      </Tabs>
    </PageShell>
  );
}

/**
 * The admin users page (`/{countryId}/admin/users`): admins find signed-in
 * users, change their types and read each user's type changes. Everyone
 * else, signed out included, gets a not-found page once their type is
 * known, and no admin route is called for them. Until it is known the page
 * says it is loading, or shows why /v2/me failed.
 */
export default function AdminUsersPage() {
  const userType = useUserType();
  if (userType === null) {
    return <UserTypeNotKnown />;
  }
  return (
    <MinimumUserType minimum="admin" fallback={<AdminPageNotFound />}>
      <AdminUsers />
    </MinimumUserType>
  );
}
