import type { ReactNode } from 'react';
import MinimumUserType from '@/components/auth/MinimumUserType';
import { Button, Spinner, Stack, Text, Title } from '@/components/ui';
import { colors } from '@/designTokens';
import { useMe } from '@/hooks/useMe';
import { useUserType } from '@/hooks/useUserType';

function PageShell({ children }: { children: ReactNode }) {
  return <Stack gap="xl">{children}</Stack>;
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

/**
 * One page of the admin settings, laid out like the account settings'
 * pages: its title, then its cards. Only an admin gets `children`, so no
 * admin route is called for anyone else. Everyone else, signed out
 * included, gets a not-found page once their type is known. Until it is
 * known the page says it is loading, or shows why /v2/me failed.
 */
export default function AdminPage({ title, children }: { title: string; children: ReactNode }) {
  const userType = useUserType();
  if (userType === null) {
    return <UserTypeNotKnown />;
  }
  return (
    <MinimumUserType minimum="admin" fallback={<AdminPageNotFound />}>
      <PageShell>
        <Title order={1} style={{ margin: 0 }}>
          {title}
        </Title>
        {children}
      </PageShell>
    </MinimumUserType>
  );
}
