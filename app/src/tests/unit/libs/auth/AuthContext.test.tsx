import { act, render } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import {
  SessionClosedError,
  useAuthStatus,
  type AuthContextValue,
  type SettledSession,
} from '@/libs/auth/AuthContext';
import { mockMeItem } from '@/tests/fixtures/api/v2UserMocks';
import {
  AuthTestProvider,
  makeAuthValue,
  signedInAuthValue,
} from '@/tests/fixtures/libs/auth/authMocks';

/** Asks for the settled session on mount and hands the promise to the test. */
function AskForSession({ onAsk }: { onAsk: (waiting: Promise<SettledSession>) => void }) {
  const { settledSession } = useAuthStatus();
  onAsk(settledSession());
  return null;
}

function renderWaiting(auth: AuthContextValue) {
  let waiting: Promise<SettledSession> | undefined;
  const rendered = render(
    <AuthTestProvider value={auth}>
      <AskForSession
        onAsk={(asked) => {
          waiting ??= asked;
        }}
      />
    </AuthTestProvider>
  );
  return { ...rendered, waiting: () => waiting! };
}

describe('settledSession', () => {
  test('given the session is restoring then a waiter is answered once it settles', async () => {
    // Given
    const { waiting, rerender } = renderWaiting(makeAuthValue({ status: 'loading' }));

    // When
    rerender(
      <AuthTestProvider value={signedInAuthValue()}>
        <AskForSession onAsk={() => {}} />
      </AuthTestProvider>
    );

    // Then
    await expect(waiting()).resolves.toEqual({ status: 'authenticated', user: mockMeItem });
  });

  test('given the provider unmounts while restoring then its waiters fail instead of hanging', async () => {
    // Given
    const { waiting, unmount } = renderWaiting(makeAuthValue({ status: 'loading' }));

    // When
    act(() => unmount());

    // Then
    await expect(waiting()).rejects.toBeInstanceOf(SessionClosedError);
    await expect(waiting()).rejects.toThrow(/interrupted before your session was restored/);
  });
});
