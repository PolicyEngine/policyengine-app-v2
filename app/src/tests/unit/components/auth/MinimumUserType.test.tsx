import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, render, screen, waitFor } from '@test-utils';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import MinimumUserType from '@/components/auth/MinimumUserType';
import { useUserType } from '@/hooks/useUserType';
import type { AuthContextValue } from '@/libs/auth/AuthContext';
import { errorResponse, itemResponse, meItemOfType } from '@/tests/fixtures/api/v2UserMocks';
import {
  AuthTestProvider,
  makeAuthValue,
  signedInAuthValue,
} from '@/tests/fixtures/libs/auth/authMocks';
import type { MeItem, UserType } from '@/types/v2User';

const RESTRICTED_CONTENT = 'Publish this research post';
const FALLBACK_CONTENT = 'Only authors can publish research posts';

const fetchMock = vi.fn();

/** Shows the user type the component reads, so a test can wait until /v2/me has answered. */
function UserTypeProbe() {
  return <p>User type: {useUserType()}</p>;
}

function renderRestrictedContent(
  auth: AuthContextValue,
  { minimum = 'author', fallback }: { minimum?: UserType; fallback?: ReactNode } = {}
) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <AuthTestProvider value={auth}>
        <MinimumUserType minimum={minimum} fallback={fallback}>
          <p>{RESTRICTED_CONTENT}</p>
        </MinimumUserType>
        <UserTypeProbe />
      </AuthTestProvider>
    </QueryClientProvider>
  );
}

/** Answers GET /v2/me with `meResponse`, and any other request with a 404. */
function answerMe(meResponse: () => Response | Promise<Response>) {
  fetchMock.mockImplementation(async (url: string, init: RequestInit) =>
    new URL(url).pathname === '/v2/me' && init.method === 'GET'
      ? meResponse()
      : errorResponse(404, 'Not found')
  );
}

function answerMeWithUser(meItem: MeItem) {
  answerMe(() => itemResponse(meItem));
}

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('MinimumUserType', () => {
  test('given an author and an author minimum then the content shows', async () => {
    // Given
    answerMeWithUser(meItemOfType('author'));

    // When
    renderRestrictedContent(signedInAuthValue());

    // Then
    expect(await screen.findByText(RESTRICTED_CONTENT)).toBeInTheDocument();
  });

  test('given an admin and an author minimum then the content shows', async () => {
    // Given
    answerMeWithUser(meItemOfType('admin'));

    // When
    renderRestrictedContent(signedInAuthValue());

    // Then
    expect(await screen.findByText(RESTRICTED_CONTENT)).toBeInTheDocument();
  });

  test('given a standard user and an author minimum then the content is hidden', async () => {
    // Given
    answerMeWithUser(meItemOfType('standard'));

    // When
    renderRestrictedContent(signedInAuthValue());
    await screen.findByText('User type: standard');

    // Then
    expect(screen.queryByText(RESTRICTED_CONTENT)).not.toBeInTheDocument();
  });

  test('given a standard user and an author minimum with a fallback then the fallback shows', async () => {
    // Given
    answerMeWithUser(meItemOfType('standard'));

    // When
    renderRestrictedContent(signedInAuthValue(), { fallback: <p>{FALLBACK_CONTENT}</p> });
    await screen.findByText('User type: standard');

    // Then
    expect(screen.getByText(FALLBACK_CONTENT)).toBeInTheDocument();
  });

  test('given a signed-out visitor and a standard minimum then the content is hidden', () => {
    // When
    renderRestrictedContent(makeAuthValue(), { minimum: 'standard' });

    // Then
    expect(screen.queryByText(RESTRICTED_CONTENT)).not.toBeInTheDocument();
  });

  test('given an author while /v2/me loads then the content stays hidden until it answers', async () => {
    // Given
    let answerPendingMe: (response: Response) => void = () => {};
    answerMe(
      () =>
        new Promise<Response>((resolve) => {
          answerPendingMe = resolve;
        })
    );
    renderRestrictedContent(signedInAuthValue());
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(screen.queryByText(RESTRICTED_CONTENT)).not.toBeInTheDocument();

    // When
    await act(async () => answerPendingMe(itemResponse(meItemOfType('author'))));

    // Then
    expect(await screen.findByText(RESTRICTED_CONTENT)).toBeInTheDocument();
  });
});
