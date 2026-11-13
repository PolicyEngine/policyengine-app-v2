import type { ReactNode } from 'react';
import {
  focusManager,
  onlineManager,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query';
import { act, renderHook } from '@test-utils';
import { CountryProvider } from '@/contexts/CountryContext';
import { LocationProvider } from '@/contexts/LocationContext';
import { useMe } from '@/hooks/useMe';
import type { AuthContextValue } from '@/libs/auth/AuthContext';
import type { CountryId } from '@/libs/countries';
import { AuthTestProvider } from '@/tests/fixtures/libs/auth/authMocks';

/**
 * Who is using the app in a test: the sign-in state, the calculator's
 * country and, when set, the page's path (otherwise the providers around
 * it, or the window, give the path).
 */
export interface TestSession {
  auth: AuthContextValue;
  countryId: CountryId;
  pathname?: string;
}

/** A query client that does not retry, so a failed request fails at once. */
export function createTestQueryClient(): QueryClient {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

/**
 * A query client with the calculator's query defaults (calculator-app's
 * providers.tsx: data stays fresh for five minutes and is read again when
 * the window regains focus), and react-query's default of three retries.
 * Only the wait between retries is set to zero, so a test does not
 * wait the seconds production would.
 */
export function createProductionLikeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { staleTime: 5 * 60 * 1000, refetchOnWindowFocus: true, retryDelay: 0 },
    },
  });
}

/**
 * The browser window losing and regaining focus, which react-query treats
 * as a return to the page. Undo with `forgetWindowFocus()` after the test.
 */
export async function returnToWindow() {
  await act(async () => {
    focusManager.setFocused(false);
    focusManager.setFocused(true);
  });
}

/** The browser going offline and coming back online, which react-query treats as a reconnect. */
export async function reconnect() {
  await act(async () => {
    onlineManager.setOnline(false);
    onlineManager.setOnline(true);
  });
}

/** Hands focus tracking back to the browser's own events. */
export function forgetWindowFocus() {
  focusManager.setFocused(undefined);
}

/** The providers `useMe` reads: the query client, the country, the sign-in state and the path. */
export function UserSessionProviders({
  queryClient,
  session,
  children,
}: {
  queryClient: QueryClient;
  session: TestSession;
  children: ReactNode;
}) {
  const content = (
    <QueryClientProvider client={queryClient}>
      <CountryProvider value={session.countryId}>
        <AuthTestProvider value={session.auth}>{children}</AuthTestProvider>
      </CountryProvider>
    </QueryClientProvider>
  );
  return session.pathname === undefined ? (
    content
  ) : (
    <LocationProvider value={{ pathname: session.pathname, search: '' }}>
      {content}
    </LocationProvider>
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

/** Lets queued promises and timers run, so a request a hook would send has been sent. */
export async function letPendingWorkRun() {
  await act(() => new Promise((resolve) => setTimeout(resolve, 0)));
}
