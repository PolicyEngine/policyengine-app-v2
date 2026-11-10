import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook } from '@test-utils';
import { CountryProvider } from '@/contexts/CountryContext';
import { useMe } from '@/hooks/useMe';
import type { AuthContextValue } from '@/libs/auth/AuthContext';
import type { CountryId } from '@/libs/countries';
import { AuthTestProvider } from '@/tests/fixtures/libs/auth/authMocks';

/** Who is using the app in a test: the sign-in state and the calculator's country. */
export interface TestSession {
  auth: AuthContextValue;
  countryId: CountryId;
}

/** A query client that does not retry, so a failed request fails at once. */
export function createTestQueryClient(): QueryClient {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

/** The providers `useMe` reads: the query client, the country and the sign-in state. */
export function UserSessionProviders({
  queryClient,
  session,
  children,
}: {
  queryClient: QueryClient;
  session: TestSession;
  children: ReactNode;
}) {
  return (
    <QueryClientProvider client={queryClient}>
      <CountryProvider value={session.countryId}>
        <AuthTestProvider value={session.auth}>{children}</AuthTestProvider>
      </CountryProvider>
    </QueryClientProvider>
  );
}

/**
 * Renders `useHook` in `initialSession`. `changeSession` renders it again in
 * another session (another account or country) with the same query cache.
 */
export function renderHookInSession<HookResult>(
  useHook: () => HookResult,
  initialSession: TestSession
) {
  const queryClient = createTestQueryClient();
  let currentSession = initialSession;
  const view = renderHook(useHook, {
    wrapper: ({ children }: { children: ReactNode }) => (
      <UserSessionProviders queryClient={queryClient} session={currentSession}>
        {children}
      </UserSessionProviders>
    ),
  });
  return {
    ...view,
    queryClient,
    changeSession(nextSession: TestSession) {
      currentSession = nextSession;
      view.rerender();
    },
  };
}

/** Shows the status of the `/v2/me` query, so a test can wait until it has failed. */
export function MeStatusProbe() {
  return <p>/v2/me status: {useMe().status}</p>;
}
