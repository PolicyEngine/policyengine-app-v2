import type { ReactNode } from 'react';
import { act, render, screen, waitFor } from '@test-utils';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import MinimumUserType from '@/components/auth/MinimumUserType';
import type { AuthContextValue } from '@/libs/auth/AuthContext';
import {
  answerMe,
  answerMeWithUser,
  deferredResponse,
  errorResponse,
  itemResponse,
  meItemOfType,
} from '@/tests/fixtures/api/v2UserMocks';
import {
  createTestQueryClient,
  letPendingWorkRun,
  MeStatusProbe,
  UserSessionProviders,
} from '@/tests/fixtures/hooks/useMeMocks';
import { UserTypeProbe } from '@/tests/fixtures/hooks/useUserTypeMocks';
import { makeAuthValue, signedInAuthValue } from '@/tests/fixtures/libs/auth/authMocks';
import type { UserType } from '@/types/v2User';

const RESTRICTED_CONTENT = 'Publish this research post';
const FALLBACK_CONTENT = 'Only authors can publish research posts';

const fetchMock = vi.fn();

function renderRestrictedContent(
  auth: AuthContextValue,
  {
    minimum = 'author',
    fallback,
    pathname,
  }: { minimum?: UserType; fallback?: ReactNode; pathname?: string } = {}
) {
  const queryClient = createTestQueryClient();
  const view = render(
    <UserSessionProviders queryClient={queryClient} session={{ auth, countryId: 'us', pathname }}>
      <MinimumUserType minimum={minimum} fallback={fallback}>
        <p>{RESTRICTED_CONTENT}</p>
      </MinimumUserType>
      <UserTypeProbe />
      <MeStatusProbe />
    </UserSessionProviders>
  );
  return { ...view, queryClient };
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
    answerMeWithUser(fetchMock, meItemOfType('author'));

    // When
    renderRestrictedContent(signedInAuthValue());

    // Then
    expect(await screen.findByText(RESTRICTED_CONTENT)).toBeInTheDocument();
  });

  test('given an admin and an author minimum then the content shows', async () => {
    // Given
    answerMeWithUser(fetchMock, meItemOfType('admin'));

    // When
    renderRestrictedContent(signedInAuthValue());

    // Then
    expect(await screen.findByText(RESTRICTED_CONTENT)).toBeInTheDocument();
  });

  test('given a standard user and an author minimum then the content is hidden', async () => {
    // Given
    answerMeWithUser(fetchMock, meItemOfType('standard'));

    // When
    renderRestrictedContent(signedInAuthValue());
    await screen.findByText('User type: standard');

    // Then
    expect(screen.queryByText(RESTRICTED_CONTENT)).not.toBeInTheDocument();
  });

  test('given a standard user and an author minimum with a fallback then the fallback shows', async () => {
    // Given
    answerMeWithUser(fetchMock, meItemOfType('standard'));

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
    const pendingMe = deferredResponse();
    answerMe(fetchMock, { meResponse: () => pendingMe.response });
    renderRestrictedContent(signedInAuthValue());
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(screen.queryByText(RESTRICTED_CONTENT)).not.toBeInTheDocument();

    // When
    await act(async () => pendingMe.answer(itemResponse(meItemOfType('author'))));

    // Then
    expect(await screen.findByText(RESTRICTED_CONTENT)).toBeInTheDocument();
  });

  test('given a signed-in user while /v2/me loads then the fallback is not shown', async () => {
    // Given
    answerMe(fetchMock, { meResponse: () => deferredResponse().response });

    // When
    renderRestrictedContent(signedInAuthValue(), { fallback: <p>{FALLBACK_CONTENT}</p> });
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());

    // Then
    expect(screen.queryByText(FALLBACK_CONTENT)).not.toBeInTheDocument();
  });

  test('given /v2/me fails before it has answered then neither the content nor the fallback shows', async () => {
    // Given
    answerMe(fetchMock, {
      meResponse: () => errorResponse(500, 'The v2 database cannot be reached'),
    });

    // When
    renderRestrictedContent(signedInAuthValue(), { fallback: <p>{FALLBACK_CONTENT}</p> });
    await screen.findByText('/v2/me status: error');

    // Then
    expect(screen.queryByText(FALLBACK_CONTENT)).not.toBeInTheDocument();
    expect(screen.queryByText(RESTRICTED_CONTENT)).not.toBeInTheDocument();
  });

  test('given a signed-out visitor and a standard minimum with a fallback then the fallback shows', () => {
    // When
    renderRestrictedContent(makeAuthValue(), {
      minimum: 'standard',
      fallback: <p>{FALLBACK_CONTENT}</p>,
    });

    // Then
    expect(screen.getByText(FALLBACK_CONTENT)).toBeInTheDocument();
  });

  test('given a refetch of /v2/me fails after an author saw the content then the content stays', async () => {
    // Given
    answerMeWithUser(fetchMock, meItemOfType('author'));
    const { queryClient } = renderRestrictedContent(signedInAuthValue());
    await screen.findByText(RESTRICTED_CONTENT);
    answerMe(fetchMock, {
      meResponse: () => errorResponse(503, 'The v2 database cannot be reached'),
    });

    // When
    await act(() => queryClient.refetchQueries());
    await screen.findByText('/v2/me status: error');

    // Then
    expect(screen.getByText(RESTRICTED_CONTENT)).toBeInTheDocument();
  });

  test('given an admin on the sign-in callback then neither the content nor the fallback shows', async () => {
    // Given
    answerMeWithUser(fetchMock, meItemOfType('admin'));

    // When
    renderRestrictedContent(signedInAuthValue(), {
      fallback: <p>{FALLBACK_CONTENT}</p>,
      pathname: '/us/callback',
    });
    await letPendingWorkRun();

    // Then
    expect(screen.queryByText(RESTRICTED_CONTENT)).not.toBeInTheDocument();
    expect(screen.queryByText(FALLBACK_CONTENT)).not.toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
